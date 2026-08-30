import assert from "node:assert/strict";
import { beforeEach, describe, it } from "mocha";
import { network } from "hardhat";
import { ZeroAddress, keccak256, toUtf8Bytes, ZeroHash } from "ethers";

const DID = "did:secure-platform:alice";
const DATA_HASH = ZeroHash;
const { ethers } = await network.create();

async function expectRevertWithName(action: Promise<unknown>, errorName: string) {
  try {
    await action;
    assert.fail(`Expected transaction to revert with ${errorName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.ok(message.includes(errorName), `Expected ${errorName}, received: ${message}`);
  }
}

describe("IdentityRegistry", function () {
  async function deployRegistry() {
    const [deployer, alice, bob, outsider, newWallet] = await ethers.getSigners();
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    const registry = await IdentityRegistry.deploy();
    await registry.waitForDeployment();
    return { registry, deployer, alice, bob, outsider, newWallet };
  }

  let fixture: Awaited<ReturnType<typeof deployRegistry>>;

  beforeEach(async function () {
    fixture = await deployRegistry();
  });

  it("deploys and grants the deployer the expected administrator roles", async function () {
    const { registry, deployer } = fixture;
    assert.equal(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), deployer.address), true);
    assert.equal(await registry.hasRole(await registry.ADMIN_ROLE(), deployer.address), true);
  });

  it("registers a valid identity with its supplied DID and PENDING lifecycle state", async function () {
    const { registry, alice } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);

    const [did, status, registeredAt, revokedAt] = await registry.getIdentity(alice.address);
    assert.equal(did, DID);
    assert.equal(status, 1n); // PENDING
    assert.ok(registeredAt > 0n);
    assert.equal(revokedAt, 0n);
    assert.equal(await registry.isRegistered(alice.address), true);
    assert.equal(await registry.isIdentityActive(alice.address), false); // Must be ACTIVE (3n) to be true
  });

  it("allows admin to verify an identity", async function () {
    const { registry, deployer, alice } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);

    await registry.connect(deployer).verifyIdentity(alice.address);
    const [, status] = await registry.getIdentity(alice.address);
    assert.equal(status, 2n); // VERIFIED
  });

  it("allows verified user to bind a wallet", async function () {
    const { registry, deployer, alice, newWallet } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await registry.connect(deployer).verifyIdentity(alice.address);

    await registry.connect(alice).bindWallet(newWallet.address);

    // Alice's old address should no longer be registered
    assert.equal(await registry.isRegistered(alice.address), false);

    // New wallet should be ACTIVE
    const [, status] = await registry.getIdentity(newWallet.address);
    assert.equal(status, 3n); // ACTIVE
    assert.equal(await registry.isIdentityActive(newWallet.address), true);

    // DID should resolve to new wallet
    assert.equal(await registry.getAddressByDID(DID), newWallet.address);
  });

  it("allows active user to rebind wallet", async function () {
    const { registry, deployer, alice, newWallet, bob } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await registry.connect(deployer).verifyIdentity(alice.address);
    await registry.connect(alice).bindWallet(newWallet.address);

    // Now rebind from newWallet to bob
    await registry.connect(newWallet).rebindWallet(bob.address);

    // newWallet should no longer be registered
    assert.equal(await registry.isRegistered(newWallet.address), false);

    // bob should be ACTIVE
    const [, status] = await registry.getIdentity(bob.address);
    assert.equal(status, 3n); // ACTIVE

    // DID should resolve to bob
    assert.equal(await registry.getAddressByDID(DID), bob.address);
  });

  it("reports a wallet as unregistered before it has registered", async function () {
    const { registry, alice } = fixture;
    assert.equal(await registry.isRegistered(alice.address), false);
    assert.equal(await registry.isIdentityActive(alice.address), false);
  });

  it("prevents duplicate wallet registrations", async function () {
    const { registry, alice } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await expectRevertWithName(registry.connect(alice).registerIdentity("did:secure-platform:alice-2", DATA_HASH), "IdentityAlreadyRegistered");
  });

  it("rejects an empty DID", async function () {
    const { registry, alice } = fixture;
    await expectRevertWithName(registry.connect(alice).registerIdentity("", DATA_HASH), "EmptyDID");
  });

  it("prevents two wallets from registering the same DID", async function () {
    const { registry, alice, bob } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await expectRevertWithName(registry.connect(bob).registerIdentity(DID, DATA_HASH), "DIDAlreadyExists");
  });

  it("returns the registered wallet for a DID and zero for an unknown DID", async function () {
    const { registry, alice } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    assert.equal(await registry.getAddressByDID(DID), alice.address);
    assert.equal(await registry.getAddressByDID("did:secure-platform:unknown"), ZeroAddress);
  });

  it("reverts when reading an unknown identity", async function () {
    const { registry, alice } = fixture;
    await expectRevertWithName(registry.getIdentity(alice.address), "IdentityNotRegistered");
  });

  it("prevents a normal user from revoking another identity", async function () {
    const { registry, alice, bob } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await expectRevertWithName(registry.connect(bob).revokeIdentity(alice.address), "AccessControlUnauthorizedAccount");
  });

  it("allows an administrator to revoke an active identity while preserving registration", async function () {
    const { registry, deployer, alice } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await registry.connect(deployer).revokeIdentity(alice.address);

    const [, status, , revokedAt] = await registry.getIdentity(alice.address);
    assert.equal(status, 5n); // REVOKED
    assert.ok(revokedAt > 0n);
    assert.equal(await registry.isRegistered(alice.address), true);
    assert.equal(await registry.isIdentityActive(alice.address), false);
  });

  it("rejects zero-address, unknown, and already-revoked identity operations", async function () {
    const { registry, deployer, alice, bob } = fixture;
    await expectRevertWithName(registry.connect(deployer).revokeIdentity(ZeroAddress), "InvalidAddress");
    await expectRevertWithName(registry.connect(deployer).revokeIdentity(bob.address), "IdentityNotRegistered");

    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    await registry.connect(deployer).revokeIdentity(alice.address);
    await expectRevertWithName(registry.connect(deployer).revokeIdentity(alice.address), "IdentityAlreadyRevoked");
  });

  it("emits IdentityRegistered with a DID hash, registration time, and dataHash", async function () {
    const { registry, alice } = fixture;
    const transaction = await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    const receipt = await transaction.wait();
    const event = receipt?.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "IdentityRegistered");

    assert.ok(event);
    assert.equal(event.args.user, alice.address);
    assert.equal(event.args.didHash, keccak256(toUtf8Bytes(DID)));
    assert.equal(event.args.did, DID);
    assert.equal(event.args.dataHash, DATA_HASH);
    assert.ok(event.args.registeredAt > 0n);
  });

  it("emits IdentityRevoked with the subject and revocation time", async function () {
    const { registry, deployer, alice } = fixture;
    await registry.connect(alice).registerIdentity(DID, DATA_HASH);
    const transaction = await registry.connect(deployer).revokeIdentity(alice.address);
    const receipt = await transaction.wait();
    const event = receipt?.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "IdentityRevoked");

    assert.ok(event);
    assert.equal(event.args.user, alice.address);
    assert.ok(event.args.revokedAt > 0n);
  });
});
