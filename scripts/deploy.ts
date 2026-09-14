import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.create();
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const manager = signers[1];
  const auditor = signers[2];
  const user = signers[3];
  console.log(`Deploying SecureAssetPlatform with account: ${deployer.address}`);

  const factory = await ethers.getContractFactory("SecureAssetPlatform");
  const secureAssetPlatform = await factory.deploy(deployer.address);
  await secureAssetPlatform.waitForDeployment();
  const secureAssetPlatformAddress = await secureAssetPlatform.getAddress();
  console.log(`SecureAssetPlatform deployed at: ${secureAssetPlatformAddress}`);

  // Register and configure demo identities
  const MANAGER_ROLE = await secureAssetPlatform.MANAGER_ROLE();
  const AUDITOR_ROLE = await secureAssetPlatform.AUDITOR_ROLE();

  // Register manager identity & grant role
  await secureAssetPlatform.connect(deployer).registerIdentity(manager.address, ethers.id("did:bel:manager"));
  await secureAssetPlatform.connect(deployer).grantRole(MANAGER_ROLE, manager.address);
  // Also grant MANAGER_ROLE to deployer for administrative scripts and tests
  await secureAssetPlatform.connect(deployer).grantRole(MANAGER_ROLE, deployer.address);

  // Register auditor identity & grant role
  await secureAssetPlatform.connect(deployer).registerIdentity(auditor.address, ethers.id("did:bel:auditor"));
  await secureAssetPlatform.connect(deployer).grantRole(AUDITOR_ROLE, auditor.address);

  // Register regular user identity
  await secureAssetPlatform.connect(deployer).registerIdentity(user.address, ethers.id("did:bel:user"));
  console.log("Demo identities registered in SecureAssetPlatform (manager, auditor, user)");

  // Read ABI from Hardhat build artifact
  const artifactPath = path.join(process.cwd(), "artifacts/contracts/SecureAssetPlatform.sol/SecureAssetPlatform.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const chain = await ethers.provider.getNetwork();
  const chainId = Number(chain.chainId);

  const deployment = {
    chainId: chainId || 31337,
    contracts: {
      SecureAssetPlatform: {
        address: secureAssetPlatformAddress,
        abi: artifact.abi
      }
    },
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(deploymentsDir, "local.json"), JSON.stringify(deployment, null, 2));
  console.log("Deployment artifact written to deployments/local.json");
  console.log("SecureAssetPlatform successfully deployed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});