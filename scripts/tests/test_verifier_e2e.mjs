import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test, { after, before } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { ContractFactory, JsonRpcProvider, NonceManager, Wallet, keccak256, toUtf8Bytes } from "ethers";

const root = resolve(new URL("../..", import.meta.url).pathname);
const rpcUrl = "http://127.0.0.1:18545";
const chainId = 31337n;
const hardhatDefaultPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
let localNode;
let nodeOutput = "";

async function waitForRpc() {
  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      });
      const payload = await response.json();
      if (payload.result === "0x7a69") return;
      throw new Error(`Unexpected local chain ID: ${String(payload.result)}`);
    } catch (error) {
      lastError = error;
      if (localNode?.exitCode !== null) break;
      await delay(100);
    }
  }
  throw new Error(`Disposable Hardhat RPC did not start: ${String(lastError)}\n${nodeOutput}`);
}

function runVerifier(args) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, ["scripts/verify_asset.mjs", ...args], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (exitCode) => resolveResult({ exitCode, stdout, stderr }));
  });
}

before(async () => {
  localNode = spawn(resolve(root, "node_modules/.bin/hardhat"), ["node", "--hostname", "127.0.0.1", "--port", "18545", "--chain-id", "31337"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  localNode.stdout.on("data", (chunk) => { nodeOutput += chunk; });
  localNode.stderr.on("data", (chunk) => { nodeOutput += chunk; });
  await waitForRpc();
});

after(async () => {
  if (!localNode || localNode.exitCode !== null) return;
  localNode.kill("SIGTERM");
  await Promise.race([once(localNode, "exit"), delay(5_000)]);
  if (localNode.exitCode === null) localNode.kill("SIGKILL");
});

test("verifier reads a disposable deployed contract directly and rejects a bytecode-hash mismatch", async () => {
  const artifactPath = resolve(root, "artifacts/contracts/SecureAssetPlatform.sol/SecureAssetPlatform.json");
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const provider = new JsonRpcProvider(rpcUrl);
  const admin = new NonceManager(new Wallet(hardhatDefaultPrivateKey, provider));
  const adminAddress = await admin.getAddress();
  const contract = await new ContractFactory(artifact.abi, artifact.bytecode, admin).deploy(adminAddress);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  const managerRole = keccak256(toUtf8Bytes("MANAGER_ROLE"));
  const assetId = keccak256(toUtf8Bytes("VERIFIER-E2E-ASSET"));
  const metadataHash = keccak256(toUtf8Bytes("VERIFIER-E2E-METADATA"));

  await (await contract.grantRole(managerRole, adminAddress)).wait();
  await (await contract.mintAndAllocateAsset(adminAddress, assetId, metadataHash)).wait();
  const codeHash = keccak256(await provider.getCode(contractAddress));
  const sharedArgs = [
    "--rpc-url", rpcUrl,
    "--chain-id", chainId.toString(),
    "--contract-address", contractAddress,
    "--token-id", "0",
    "--expected-owner", adminAddress,
    "--expected-asset-id", assetId,
    "--expected-metadata-hash", metadataHash,
  ];

  const verified = await runVerifier([...sharedArgs, "--expected-code-hash", codeHash]);
  assert.equal(verified.exitCode, 0, verified.stderr);
  const verifiedResult = JSON.parse(verified.stdout);
  assert.equal(verifiedResult.verified, true);
  assert.equal(verifiedResult.evidence.source, "direct-rpc-contract-read");
  assert.equal(verifiedResult.evidence.deployed_code_hash, codeHash);
  assert.equal(verifiedResult.evidence.token_id, "0");

  const mismatched = await runVerifier([...sharedArgs, "--expected-code-hash", `0x${"f".repeat(64)}`]);
  assert.equal(mismatched.exitCode, 3, mismatched.stderr);
  const mismatchResult = JSON.parse(mismatched.stdout);
  assert.equal(mismatchResult.verified, false);
  assert.deepEqual(mismatchResult.mismatches, ["deployed_code_hash"]);
});
