import { readFileSync } from "node:fs";
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANAGER_ROLE"));
const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));
const USER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("USER_ROLE"));
const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const GAS_BUDGETS = (JSON.parse(readFileSync("config/gas-budgets.json", "utf8")) as {
  budgets: Record<string, number>;
}).budgets;

async function deployFixture() {
  const [admin, manager, auditor, user, recipient, outsider, replacement] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("SecureAssetPlatform");
  const platform = await factory.deploy(admin.address);
  await platform.waitForDeployment();
  await platform.registerIdentity(manager.address, ethers.keccak256(ethers.toUtf8Bytes("did:example:manager")));
  await platform.registerIdentity(auditor.address, ethers.keccak256(ethers.toUtf8Bytes("did:example:auditor")));
  await platform.registerIdentity(user.address, ethers.keccak256(ethers.toUtf8Bytes("did:example:user")));
  await platform.registerIdentity(recipient.address, ethers.keccak256(ethers.toUtf8Bytes("did:example:recipient")));
  await platform.grantRole(MANAGER_ROLE, manager.address);
  await platform.grantRole(AUDITOR_ROLE, auditor.address);
  return { platform, admin, manager, auditor, user, recipient, outsider, replacement };
}

describe("SecureAssetPlatform", function () {
  it("registers identities and grants the user role", async function () {
    const { platform, user } = await deployFixture();
    expect(await platform.hasRole(USER_ROLE, user.address)).to.equal(true);
    const profile = await platform.identityRegistry(user.address);
    expect(profile.isActive).to.equal(true);
  });

  it("rejects duplicate registration and allows controlled key replacement", async function () {
    const { platform, admin, user, replacement } = await deployFixture();
    await expect(
      platform.registerIdentity(user.address, ethers.keccak256(ethers.toUtf8Bytes("duplicate"))),
    ).to.revert(ethers);
    await expect(
      platform.registerIdentity(replacement.address, ethers.keccak256(ethers.toUtf8Bytes("did:example:user"))),
    ).to.revert(ethers);

    const replacementDid = ethers.keccak256(ethers.toUtf8Bytes("did:example:replacement"));
    await expect(platform.connect(admin).replaceIdentityKey(user.address, replacement.address, replacementDid))
      .to.emit(platform, "IdentityKeyReplaced")
      .withArgs(user.address, replacement.address, replacementDid);
    expect((await platform.identityRegistry(user.address)).isActive).to.equal(false);
    expect((await platform.identityRegistry(replacement.address)).isActive).to.equal(true);
  });

  it("allows only an active manager to mint and allocate unique assets", async function () {
    const { platform, manager, recipient, outsider } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-001"));

    await expect(
      platform.connect(outsider).mintAndAllocateAsset(recipient.address, assetId, metadataHash),
    ).to.revert(ethers);

    await expect(platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash))
      .to.emit(platform, "AssetMintedAndAllocated")
      .withArgs(0, recipient.address, assetId, metadataHash);
    expect(await platform.ownerOf(0)).to.equal(recipient.address);
    await expect(platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash)).to.revert(ethers);
  });

  it("blocks access and transfer for suspended assets until a manager restores them", async function () {
    const { platform, manager, user, recipient } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-STATUS-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-status-001"));
    const action = ethers.keccak256(ethers.toUtf8Bytes("READ_ASSET"));

    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);
    await expect(platform.connect(manager).setAssetStatus(0, 1))
      .to.emit(platform, "AssetStatusChanged")
      .withArgs(0, 1, manager.address);
    expect(await platform.assetStatus(0)).to.equal(1);
    await expect(platform.connect(manager).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(manager.address, 0, action, false);
    await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0)).to.revert(ethers);

    await platform.connect(manager).setAssetStatus(0, 0);
    await expect(platform.connect(manager).setAssetStatus(0, 0)).to.revert(ethers);
    await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0)).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(user.address);

    await platform.connect(manager).setAssetStatus(0, 2);
    await expect(platform.connect(manager).setAssetStatus(0, 0)).to.revert(ethers);
    await platform.connect(manager).setAssetStatus(0, 3);
    await expect(platform.connect(manager).setAssetStatus(0, 0)).to.revert(ethers);
  });

  it("records access decisions without reverting on denial", async function () {
    const { platform, manager, user, auditor, recipient } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-002"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-002"));
    const action = ethers.keccak256(ethers.toUtf8Bytes("READ_ASSET"));
    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

    await expect(platform.connect(user).requestAccess(0, ethers.ZeroHash)).to.revert(ethers);
    await expect(platform.connect(user).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, action, false);
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, true, 0))
      .to.emit(platform, "AccessRuleSet")
      .withArgs(0, action, user.address, true, 0, manager.address);
    await expect(platform.connect(user).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, action, true);
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, false, 0)).not.to.revert(ethers);
    await expect(platform.connect(user).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, action, false);
    await expect(platform.connect(auditor).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(auditor.address, 0, action, true);
  });

  it("expires access rules and rejects stale expiry configuration", async function () {
    const { platform, manager, user, recipient } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-EXPIRY-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-expiry-001"));
    const action = ethers.keccak256(ethers.toUtf8Bytes("READ_ASSET"));
    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);
    const latestBlock = await ethers.provider.getBlock("latest");
    const expiresAt = BigInt(latestBlock!.timestamp + 10);

    await platform.connect(manager).setAccessRule(0, user.address, action, true, expiresAt);
    await expect(platform.connect(user).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, action, true);
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, true, BigInt(latestBlock!.timestamp - 1)))
      .to.revert(ethers);

    await ethers.provider.send("evm_increaseTime", [11]);
    await ethers.provider.send("evm_mine", []);
    await expect(platform.connect(user).requestAccess(0, action))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, action, false);
  });

  it("requires an active manager for lifecycle transitions", async function () {
    const { platform, manager, user, recipient } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-LIFECYCLE-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-lifecycle-001"));
    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);
    await expect(platform.connect(user).setAssetStatus(0, 1)).to.revert(ethers);
    await platform.connect(manager).setAssetStatus(0, 3);
    await expect(platform.connect(manager).setAssetStatus(0, 2)).to.revert(ethers);
  });

  it("offboards an identity, revokes roles, and emits an offboarding event", async function () {
    const { platform, admin, manager } = await deployFixture();
    const reason = ethers.keccak256(ethers.toUtf8Bytes("EMPLOYEE_EXIT"));
    await expect(platform.connect(admin).offboardIdentity(manager.address, reason))
      .to.emit(platform, "IdentityOffboarded")
      .withArgs(manager.address, reason);
    expect((await platform.identityRegistry(manager.address)).isActive).to.equal(false);
    expect(await platform.hasRole(MANAGER_ROLE, manager.address)).to.equal(false);
  });

  it("revokes privileged roles when an identity is deactivated", async function () {
    const { platform, admin, manager } = await deployFixture();
    await platform.connect(admin).setIdentityStatus(manager.address, false);
    expect(await platform.hasRole(MANAGER_ROLE, manager.address)).to.equal(false);
    expect(await platform.hasRole(USER_ROLE, manager.address)).to.equal(false);
  });

  it("requires the manager workflow for every transfer path", async function () {
    const { platform, manager, recipient, user, auditor } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-003"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-003"));
    await platform.connect(manager).mintAndAllocateAsset(user.address, assetId, metadataHash);

    await expect(platform.connect(user).transferAsset(user.address, recipient.address, 0)).to.revert(ethers);
    await expect(platform.connect(user).transferFrom(user.address, auditor.address, 0)).to.revert(ethers);
    await expect(platform.connect(manager).transferAsset(user.address, auditor.address, 0)).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(auditor.address);
    await expect(platform.connect(manager)["safeTransferFrom(address,address,uint256)"](auditor.address, user.address, 0)).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(user.address);
    await expect(platform.connect(manager)["safeTransferFrom(address,address,uint256,bytes)"](user.address, auditor.address, 0, "0x1234")).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(auditor.address);
  });

  it("blocks unauthorized receiver reentrancy during a safe transfer callback", async function () {
    const { platform, manager, recipient, user } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-REENTRANCY-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-reentrancy-001"));
    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

    const receiverFactory = await ethers.getContractFactory("MaliciousERC721Receiver");
    const receiver = await receiverFactory.deploy();
    await receiver.waitForDeployment();
    const receiverAddress = await receiver.getAddress();
    await platform.registerIdentity(receiverAddress, ethers.keccak256(ethers.toUtf8Bytes("did:example:receiver")));
    await receiver.configure(await platform.getAddress(), user.address, 0);

    await expect(
      platform.connect(manager)["safeTransferFrom(address,address,uint256,bytes)"](recipient.address, receiverAddress, 0, "0x"),
    ).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(receiverAddress);
    expect(await receiver.reentryAttempted()).to.equal(true);
    expect(await receiver.reentrySucceeded()).to.equal(false);
  });

  it("prevents uncontrolled expansion of the default administrator role and approvals", async function () {
    const { platform, admin, outsider } = await deployFixture();
    await expect(platform.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, outsider.address)).to.revert(ethers);
    await expect(platform.connect(admin).revokeRole(DEFAULT_ADMIN_ROLE, admin.address)).to.revert(ethers);
    await expect(platform.connect(admin).renounceRole(DEFAULT_ADMIN_ROLE, admin.address)).to.revert(ethers);
    await expect(platform.connect(admin).approve(outsider.address, 0)).to.revert(ethers);
  });

  it("keeps implemented local operations below preliminary gas budgets", async function () {
    const { platform, admin, manager, recipient, user, outsider } = await deployFixture();
    const registerReceipt = await (await platform.connect(admin).registerIdentity(
      outsider.address,
      ethers.keccak256(ethers.toUtf8Bytes("did:example:gas-outsider")),
    )).wait();
    expect(registerReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.registerIdentity));

    const roleReceipt = await (await platform.connect(admin).grantRole(AUDITOR_ROLE, outsider.address)).wait();
    expect(roleReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.grantRole));

    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-GAS-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-gas-001"));
    const mintReceipt = await (await platform.connect(manager).mintAndAllocateAsset(
      recipient.address,
      assetId,
      metadataHash,
    )).wait();
    expect(mintReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.mintAndAllocateAsset));

    const transferReceipt = await (await platform.connect(manager).transferAsset(
      recipient.address,
      user.address,
      0,
    )).wait();
    expect(transferReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.transferAsset));

    const pauseReceipt = await (await platform.connect(admin).pause()).wait();
    expect(pauseReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.pause));
  });

  it("blocks state changes while paused", async function () {
    const { platform, admin, manager, recipient } = await deployFixture();
    await platform.connect(admin).pause();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-004"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-004"));
    await expect(platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash)).to.revert(ethers);
  });
});
