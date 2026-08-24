import { network } from "hardhat";

const { ethers } = await network.create();
const identityRegistry = await ethers.deployContract("IdentityRegistry");

await identityRegistry.waitForDeployment();
console.log(`IdentityRegistry deployed at: ${await identityRegistry.getAddress()}`);
