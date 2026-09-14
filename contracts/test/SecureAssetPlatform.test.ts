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
  await platform.grantRole(MANAGER_ROLE, admin.address);
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
    expect(await platform.identityByDidHash(ethers.keccak256(ethers.toUtf8Bytes("did:example:user")))).to.equal(ethers.ZeroAddress);
    expect(await platform.identityByDidHash(replacementDid)).to.equal(replacement.address);
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
    const { platform, manager, admin, user, recipient } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-STATUS-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-status-001"));
    const action = ethers.keccak256(ethers.toUtf8Bytes("READ_ASSET"));

    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);
    await expect(platform.connect(manager).setAssetStatus(0, 1))
      .to.emit(platform, "AssetStatusChanged")
      .withArgs(0, 1, manager.address);
    expect(await platform.assetStatus(0)).to.equal(1);
    await expect(platform.connect(manager).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(manager.address, 0, false, 'Not allowed');
    await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0)).to.revert(ethers);

    await platform.connect(manager).setAssetStatus(0, 0);
    await expect(platform.connect(manager).setAssetStatus(0, 0)).to.revert(ethers);
    const latestBlock = await ethers.provider.getBlock("latest");
    const expiry = BigInt(latestBlock!.timestamp + 3600);
    await platform.connect(admin).approveTransfer(0, user.address, expiry);
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

    await expect(platform.connect(user).requestAccess(0, ethers.ZeroHash, metadataHash)).to.revert(ethers);
    await expect(platform.connect(user).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, false, 'Not allowed');
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, true, 0))
      .to.emit(platform, "AccessRuleSet")
      .withArgs(0, action, user.address, true, 0, manager.address);
    await expect(platform.connect(user).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, true, 'Access granted');
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, false, 0)).not.to.revert(ethers);
    await expect(platform.connect(user).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, false, 'Not allowed');
    await expect(platform.connect(auditor).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(auditor.address, 0, true, 'Access granted');
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
    await expect(platform.connect(user).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, true, 'Access granted');
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, true, BigInt(latestBlock!.timestamp - 1)))
      .to.revert(ethers);

    await ethers.provider.send("evm_increaseTime", [11]);
    await ethers.provider.send("evm_mine", []);
    await expect(platform.connect(user).requestAccess(0, action, metadataHash))
      .to.emit(platform, "AccessDecision")
      .withArgs(user.address, 0, false, 'Not allowed');
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
    const { platform, manager, admin, recipient, user, auditor } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-003"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-003"));
    await platform.connect(manager).mintAndAllocateAsset(user.address, assetId, metadataHash);

    await expect(platform.connect(user).transferAsset(user.address, recipient.address, 0)).to.revert(ethers);
    await expect(platform.connect(user).transferFrom(user.address, auditor.address, 0)).to.revert(ethers);
    
    const latestBlock = await ethers.provider.getBlock("latest");
    const expiry = BigInt(latestBlock!.timestamp + 3600);

    await platform.connect(admin).approveTransfer(0, auditor.address, expiry);
    await expect(platform.connect(manager).transferAsset(user.address, auditor.address, 0)).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(auditor.address);
    
    await platform.connect(admin).approveTransfer(0, user.address, expiry);
    await expect(platform.connect(manager)["safeTransferFrom(address,address,uint256)"](auditor.address, user.address, 0)).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(user.address);
    
    await platform.connect(admin).approveTransfer(0, auditor.address, expiry);
    await expect(platform.connect(manager)["safeTransferFrom(address,address,uint256,bytes)"](user.address, auditor.address, 0, "0x1234")).not.to.revert(ethers);
    expect(await platform.ownerOf(0)).to.equal(auditor.address);
  });

  it("blocks unauthorized receiver reentrancy during a safe transfer callback", async function () {
    const { platform, manager, admin, recipient, user } = await deployFixture();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-REENTRANCY-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-reentrancy-001"));
    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

    const receiverFactory = await ethers.getContractFactory("MaliciousERC721Receiver");
    const receiver = await receiverFactory.deploy();
    await receiver.waitForDeployment();
    const receiverAddress = await receiver.getAddress();
    await platform.registerIdentity(receiverAddress, ethers.keccak256(ethers.toUtf8Bytes("did:example:receiver")));
    await receiver.configure(await platform.getAddress(), user.address, 0);

    const latestBlock = await ethers.provider.getBlock("latest");
    const expiry = BigInt(latestBlock!.timestamp + 3600);
    await platform.connect(admin).approveTransfer(0, receiverAddress, expiry);
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

    const latestBlock = await ethers.provider.getBlock("latest");
    const expiry = BigInt(latestBlock!.timestamp + 3600);
    await platform.connect(admin).approveTransfer(0, user.address, expiry);
    const transferReceipt = await (await platform.connect(manager).transferAsset(
      recipient.address,
      user.address,
      0,
    )).wait();
    expect(transferReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.transferAsset));

    const pauseReceipt = await (await platform.connect(admin).pause()).wait();
    expect(pauseReceipt!.gasUsed).to.be.lessThan(BigInt(GAS_BUDGETS.pause));
  });

  it("covers invalid identity, asset, rule, and lifecycle inputs", async function () {
    const { platform, admin, manager, user, recipient, outsider, replacement } = await deployFixture();
    const didHash = ethers.keccak256(ethers.toUtf8Bytes("did:example:negative"));
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-NEGATIVE-001"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-negative-001"));
    const action = ethers.keccak256(ethers.toUtf8Bytes("READ_ASSET"));

    await expect(platform.connect(admin).registerIdentity(ethers.ZeroAddress, didHash)).to.revert(ethers);
    await expect(platform.connect(admin).registerIdentity(outsider.address, ethers.ZeroHash)).to.revert(ethers);
    await expect(platform.connect(admin).setIdentityStatus(outsider.address, false)).to.revert(ethers);
    await expect(platform.connect(admin).setIdentityStatus(admin.address, false)).to.revert(ethers);
    await expect(platform.connect(admin).grantRole(MANAGER_ROLE, outsider.address)).to.revert(ethers);
    await expect(platform.connect(admin).replaceIdentityKey(ethers.ZeroAddress, replacement.address, didHash)).to.revert(ethers);
    await expect(platform.connect(admin).replaceIdentityKey(outsider.address, replacement.address, didHash)).to.revert(ethers);
    await expect(platform.connect(admin).replaceIdentityKey(user.address, user.address, didHash)).to.revert(ethers);
    await expect(platform.connect(admin).replaceIdentityKey(user.address, replacement.address, ethers.ZeroHash)).to.revert(ethers);
    await expect(platform.connect(admin).replaceIdentityKey(admin.address, replacement.address, didHash)).to.revert(ethers);

    await expect(platform.connect(manager).mintAndAllocateAsset(outsider.address, assetId, metadataHash)).to.revert(ethers);
    await expect(platform.connect(manager).mintAndAllocateAsset(recipient.address, ethers.ZeroHash, metadataHash)).to.revert(ethers);
    await expect(platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, ethers.ZeroHash)).to.revert(ethers);
    await expect(platform.connect(manager).setAssetStatus(99, 1)).to.revert(ethers);
    await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);
    await expect(platform.connect(manager).setAssetStatus(0, 99)).to.revert(ethers);
    await expect(platform.connect(manager).setAccessRule(0, ethers.ZeroAddress, action, true, 0)).to.revert(ethers);
    await expect(platform.connect(manager).setAccessRule(0, user.address, ethers.ZeroHash, true, 0)).to.revert(ethers);
    await expect(platform.connect(manager).setAccessRule(0, outsider.address, action, true, 0)).to.revert(ethers);
    const latestBlock = await ethers.provider.getBlock("latest");
    await expect(platform.connect(manager).setAccessRule(0, user.address, action, true, BigInt(latestBlock!.timestamp - 1))).to.revert(ethers);
    await expect(platform.connect(manager).requestAccess(99, action, ethers.ZeroHash)).to.emit(platform, "AccessDecision").withArgs(manager.address, 99, false, 'Not allowed');
    await expect(platform.connect(manager).transferFrom(recipient.address, user.address, 99)).to.revert(ethers);

    await platform.connect(admin).setIdentityStatus(user.address, false);
    await platform.connect(admin).setIdentityStatus(user.address, true);
    expect((await platform.identityRegistry(user.address)).isActive).to.equal(true);
    await platform.connect(admin).setIdentityStatus(recipient.address, false);
    await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0)).to.revert(ethers);
  });

  it("emits pause and unpause state transitions", async function () {
    const { platform, admin } = await deployFixture();
    await expect(platform.connect(admin).pause()).to.emit(platform, "EmergencyStateChanged").withArgs(true);
    await expect(platform.connect(admin).unpause()).to.emit(platform, "EmergencyStateChanged").withArgs(false);
    expect(await platform.paused()).to.equal(false);
  });

  it("blocks state changes while paused", async function () {
    const { platform, admin, manager, recipient } = await deployFixture();
    await platform.connect(admin).pause();
    const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-004"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-004"));
    await expect(platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash)).to.revert(ethers);
  });

  describe("SEC-01: Key replacement DID cleanup", function () {
    it("clears old DID mapping and allows reuse of the freed DID", async function () {
      const { platform, admin, user, replacement, outsider } = await deployFixture();
      const userDid = ethers.keccak256(ethers.toUtf8Bytes("did:example:user"));
      const replacementDid = ethers.keccak256(ethers.toUtf8Bytes("did:example:replacement-2"));

      expect(await platform.identityByDidHash(userDid)).to.equal(user.address);

      await platform.connect(admin).replaceIdentityKey(user.address, replacement.address, replacementDid);

      // Old DID mapping must be completely deleted
      expect(await platform.identityByDidHash(userDid)).to.equal(ethers.ZeroAddress);
      expect(await platform.identityByDidHash(replacementDid)).to.equal(replacement.address);

      // Freed userDid can now be registered to another entity without collision
      await expect(platform.connect(admin).registerIdentity(outsider.address, userDid))
        .to.emit(platform, "IdentityRegistered")
        .withArgs(outsider.address, userDid);
      expect(await platform.identityByDidHash(userDid)).to.equal(outsider.address);
    });
  });

  describe("SEC-02: Transfer approval destination binding & expiry", function () {
    it("binds the approval to a specific recipient and emits TransferApproved", async function () {
      const { platform, admin, manager, recipient, user, auditor } = await deployFixture();
      const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-SEC02-001"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-sec02-001"));
      await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiresAt = BigInt(latestBlock!.timestamp + 3600);

      await expect(platform.connect(admin).approveTransfer(0, user.address, expiresAt))
        .to.emit(platform, "TransferApproved")
        .withArgs(0, admin.address, user.address, expiresAt);

      const approval = await platform.approvedTransfers(0);
      expect(approval.approver).to.equal(admin.address);
      expect(approval.to).to.equal(user.address);
      expect(approval.expiresAt).to.equal(expiresAt);

      // Attempting transfer to an unapproved recipient must fail
      await expect(platform.connect(manager).transferAsset(recipient.address, auditor.address, 0)).to.revert(ethers);

      // Transfer to approved recipient succeeds
      await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0))
        .to.emit(platform, "AccessDecision")
        .withArgs(manager.address, 0, true, "Transfer successful");
      expect(await platform.ownerOf(0)).to.equal(user.address);

      // Approval must be deleted after use (cannot be replayed)
      const clearedApproval = await platform.approvedTransfers(0);
      expect(clearedApproval.approver).to.equal(ethers.ZeroAddress);
    });

    it("rejects expired transfer approvals and past timestamp expiry", async function () {
      const { platform, admin, manager, recipient, user } = await deployFixture();
      const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-SEC02-EXP"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-sec02-exp"));
      await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

      const latestBlock = await ethers.provider.getBlock("latest");
      // Cannot approve with expiry in the past
      await expect(
        platform.connect(admin).approveTransfer(0, user.address, BigInt(latestBlock!.timestamp - 1))
      ).to.revert(ethers);

      // Approve with 10 second expiry
      const shortExpiry = BigInt(latestBlock!.timestamp + 10);
      await platform.connect(admin).approveTransfer(0, user.address, shortExpiry);

      // Advance time beyond expiry
      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      // Transfer must fail due to expiry
      await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0)).to.revert(ethers);
    });

    it("prevents self-approval by the same manager (Two-Person Rule)", async function () {
      const { platform, manager, recipient, user } = await deployFixture();
      const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-SEC02-SELF"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-sec02-self"));
      await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = BigInt(latestBlock!.timestamp + 3600);
      await platform.connect(manager).approveTransfer(0, user.address, expiry);
      // Same manager cannot execute the transfer
      await expect(platform.connect(manager).transferAsset(recipient.address, user.address, 0)).to.revert(ethers);
    });

    it("rejects approval for inactive recipients or non-existent assets", async function () {
      const { platform, admin, manager, recipient, outsider } = await deployFixture();
      const assetId = ethers.keccak256(ethers.toUtf8Bytes("BEL-LAB-SEC02-INACT"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("asset-sec02-inact"));
      await platform.connect(manager).mintAndAllocateAsset(recipient.address, assetId, metadataHash);

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = BigInt(latestBlock!.timestamp + 3600);
      // Unregistered / inactive recipient
      await expect(platform.connect(admin).approveTransfer(0, outsider.address, expiry)).to.revert(ethers);
      // Zero address recipient
      await expect(platform.connect(admin).approveTransfer(0, ethers.ZeroAddress, expiry)).to.revert(ethers);
      // Non-existent token
      await expect(platform.connect(admin).approveTransfer(999, recipient.address, expiry)).to.revert(ethers);
    });
  });

  describe("SEC-03: Two-step admin governance", function () {
    it("executes 2-step administrative handoff safely", async function () {
      const { platform, admin, user, outsider } = await deployFixture();
      expect(await platform.currentAdmin()).to.equal(admin.address);
      expect(await platform.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);

      // Non-admin cannot initiate admin transfer
      await expect(platform.connect(user).transferAdmin(outsider.address)).to.revert(ethers);

      // Admin cannot transfer to self or unregistered address
      await expect(platform.connect(admin).transferAdmin(admin.address)).to.revert(ethers);
      await expect(platform.connect(admin).transferAdmin(outsider.address)).to.revert(ethers);

      // Admin initiates transfer to active user
      await expect(platform.connect(admin).transferAdmin(user.address))
        .to.emit(platform, "AdminTransferInitiated")
        .withArgs(admin.address, user.address);
      expect(await platform.pendingAdmin()).to.equal(user.address);

      // Unauthorized party cannot accept admin role
      await expect(platform.connect(outsider).acceptAdmin()).to.revert(ethers);

      // Pending admin accepts role
      await expect(platform.connect(user).acceptAdmin())
        .to.emit(platform, "AdminTransferAccepted")
        .withArgs(admin.address, user.address);

      expect(await platform.currentAdmin()).to.equal(user.address);
      expect(await platform.pendingAdmin()).to.equal(ethers.ZeroAddress);
      expect(await platform.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.equal(true);
      expect(await platform.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(false);

      // New admin has administrative authority (e.g. pause/unpause)
      await expect(platform.connect(user).pause()).to.emit(platform, "EmergencyStateChanged").withArgs(true);
      await expect(platform.connect(user).unpause()).to.emit(platform, "EmergencyStateChanged").withArgs(false);

      // Old admin can no longer perform admin tasks
      await expect(platform.connect(admin).pause()).to.revert(ethers);
    });

    it("allows admin to cancel a pending transfer", async function () {
      const { platform, admin, user } = await deployFixture();

      await platform.connect(admin).transferAdmin(user.address);
      expect(await platform.pendingAdmin()).to.equal(user.address);

      await expect(platform.connect(admin).cancelAdminTransfer())
        .to.emit(platform, "AdminTransferCancelled")
        .withArgs(admin.address, user.address);

      expect(await platform.pendingAdmin()).to.equal(ethers.ZeroAddress);

      // User can no longer accept
      await expect(platform.connect(user).acceptAdmin()).to.revert(ethers);
    });
  });
});
