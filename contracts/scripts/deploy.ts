import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { network } from "hardhat";

const ROOT = path.resolve(process.cwd());
const ENVIRONMENTS = ["local", "ci", "development", "testnet", "pilot", "production"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

type DeploymentPolicy = {
  environments: Record<Environment, {
    allowedChainIds: number[];
    requiresExplicitApproval: boolean;
    allowsDisposableSigner: boolean;
  }>;
};

type Artifact = {
  abi: unknown[];
  bytecode: string;
};

function selectedEnvironment(): Environment {
  const value = process.env.APP_ENV ?? "local";
  if (!ENVIRONMENTS.includes(value as Environment)) {
    throw new Error(`Unsupported APP_ENV: ${value}`);
  }
  return value as Environment;
}

function sourceCommit(): string {
  const commit = process.env.GIT_COMMIT ?? process.env.GITHUB_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (!/^[0-9a-fA-F]{40,64}$/.test(commit)) {
    throw new Error("GIT_COMMIT or GITHUB_SHA must be a full commit hash");
  }
  return commit;
}

async function main() {
  const appEnv = selectedEnvironment();
  const policy = JSON.parse(
    await readFile(path.join(ROOT, "config/deployment-policy.json"), "utf8"),
  ) as DeploymentPolicy;
  const environmentPolicy = policy.environments[appEnv];
  if (!environmentPolicy) throw new Error(`No deployment policy for ${appEnv}`);
  if (environmentPolicy.requiresExplicitApproval && process.env.DEPLOYMENT_APPROVED !== "true") {
    throw new Error(`Deployment to ${appEnv} requires DEPLOYMENT_APPROVED=true and external operator evidence`);
  }
  if (environmentPolicy.allowedChainIds.length === 0) {
    throw new Error(`No network is approved for ${appEnv}; record the network decision before deploying`);
  }

  const { ethers } = await network.create();
  const chain = await ethers.provider.getNetwork();
  const chainId = Number(chain.chainId);
  if (!Number.isSafeInteger(chainId) || !environmentPolicy.allowedChainIds.includes(chainId)) {
    throw new Error(`Chain ID ${chainId} is not allowed for APP_ENV=${appEnv}`);
  }

  const [deployer] = await ethers.getSigners();
  const artifact = JSON.parse(
    await readFile(path.join(ROOT, "artifacts/contracts/SecureAssetPlatform.sol/SecureAssetPlatform.json"), "utf8"),
  ) as Artifact;
  if (!artifact.bytecode || artifact.bytecode === "0x") throw new Error("Deployment artifact has empty bytecode");

  const factory = await ethers.getContractFactory("SecureAssetPlatform");
  const platform = await factory.deploy(deployer.address);
  await platform.waitForDeployment();
  const contractAddress = await platform.getAddress();
  const deployedBytecode = await ethers.provider.getCode(contractAddress);
  if (deployedBytecode === "0x") throw new Error("Provider returned empty code for deployed contract");

  const rpcUrl = process.env.RPC_URL;
  const rpcIdentity = rpcUrl ? new URL(rpcUrl).origin : "hardhat-local-provider";
  const manifest = {
    schemaVersion: 1,
    environment: appEnv,
    networkName: network.name,
    chainId,
    rpcIdentity,
    contractName: "SecureAssetPlatform",
    contractAddress,
    bytecodeHash: ethers.keccak256(deployedBytecode),
    abiHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(artifact.abi))),
    sourceCommit: sourceCommit(),
    compiler: "0.8.24",
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    deployer: deployer.address,
    deployerCustody: environmentPolicy.allowsDisposableSigner
      ? "disposable-local-signer"
      : (process.env.DEPLOYER_CUSTODY ?? "external-custody-attestation-required"),
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.resolve(
    process.env.DEPLOYMENT_MANIFEST_PATH ?? path.join(ROOT, "deployments", `${appEnv}.json`),
  );
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });

  console.log(`deployer=${deployer.address}`);
  console.log(`SecureAssetPlatform=${contractAddress}`);
  console.log(`chainId=${chainId}`);
  console.log(`manifest=${outputPath}`);
  console.log("This deployment is for a disposable local/CI network only until an approved non-local policy exists.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
