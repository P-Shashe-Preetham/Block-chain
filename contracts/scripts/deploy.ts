import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("SecureAssetPlatform");
  const platform = await factory.deploy(deployer.address);
  await platform.waitForDeployment();

  console.log(`deployer=${deployer.address}`);
  console.log(`SecureAssetPlatform=${await platform.getAddress()}`);
  console.log("This deployment is for a disposable local/test network only.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
