import assert from "node:assert/strict";
import { beforeEach, describe, it } from "mocha";
import { network } from "hardhat";

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

describe("OrganizationRegistry", function () {
  async function deployRegistry() {
    const [deployer, bank, tsp, outsider] = await ethers.getSigners();
    const OrganizationRegistry = await ethers.getContractFactory("OrganizationRegistry");
    const registry = await OrganizationRegistry.deploy();
    await registry.waitForDeployment();

    const REGULATOR_ROLE = await registry.REGULATOR_ROLE();
    const BANK_ROLE = await registry.BANK_ROLE();
    const TSP_ROLE = await registry.TSP_ROLE();

    return { registry, deployer, bank, tsp, outsider, REGULATOR_ROLE, BANK_ROLE, TSP_ROLE };
  }

  let fixture: Awaited<ReturnType<typeof deployRegistry>>;

  beforeEach(async function () {
    fixture = await deployRegistry();
  });

  it("deploys and grants deployer regulator and admin roles", async function () {
    const { registry, deployer, REGULATOR_ROLE } = fixture;
    assert.equal(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), deployer.address), true);
    assert.equal(await registry.hasRole(REGULATOR_ROLE, deployer.address), true);
  });

  it("registers an organization successfully", async function () {
    const { registry, bank, BANK_ROLE } = fixture;
    await registry.connect(bank).registerOrganization("Test Bank", BANK_ROLE);

    const org = await registry.organizations(bank.address);
    assert.equal(org.name, "Test Bank");
    assert.equal(org.role, BANK_ROLE);
    assert.equal(org.status, 1n); // PENDING
    assert.equal(await registry.isOrganizationActive(bank.address), false);
  });

  it("fails to register with invalid role", async function () {
    const { registry, outsider } = fixture;
    const invalidRole = ethers.keccak256(ethers.toUtf8Bytes("INVALID_ROLE"));
    await expectRevertWithName(registry.connect(outsider).registerOrganization("Invalid", invalidRole), "InvalidRole");
  });

  it("fails to register if already registered", async function () {
    const { registry, bank, BANK_ROLE } = fixture;
    await registry.connect(bank).registerOrganization("Test Bank", BANK_ROLE);
    await expectRevertWithName(registry.connect(bank).registerOrganization("Test Bank 2", BANK_ROLE), "AlreadyRegistered");
  });

  it("allows regulator to approve organization and grants role", async function () {
    const { registry, deployer, bank, BANK_ROLE } = fixture;
    await registry.connect(bank).registerOrganization("Test Bank", BANK_ROLE);

    await registry.connect(deployer).approveOrganization(bank.address);
    const org = await registry.organizations(bank.address);
    assert.equal(org.status, 2n); // APPROVED
    assert.equal(await registry.isOrganizationActive(bank.address), true);
    assert.equal(await registry.hasRole(BANK_ROLE, bank.address), true);
  });

  it("prevents non-regulator from approving organization", async function () {
    const { registry, outsider, bank, BANK_ROLE } = fixture;
    await registry.connect(bank).registerOrganization("Test Bank", BANK_ROLE);

    await expectRevertWithName(registry.connect(outsider).approveOrganization(bank.address), "AccessControlUnauthorizedAccount");
  });

  it("allows regulator to suspend and restore an approved organization", async function () {
    const { registry, deployer, bank, BANK_ROLE } = fixture;
    await registry.connect(bank).registerOrganization("Test Bank", BANK_ROLE);
    await registry.connect(deployer).approveOrganization(bank.address);

    // Suspend
    await registry.connect(deployer).suspendOrganization(bank.address);
    let org = await registry.organizations(bank.address);
    assert.equal(org.status, 3n); // SUSPENDED
    assert.equal(await registry.isOrganizationActive(bank.address), false);
    assert.equal(await registry.hasRole(BANK_ROLE, bank.address), false);

    // Restore via approve
    await registry.connect(deployer).approveOrganization(bank.address);
    org = await registry.organizations(bank.address);
    assert.equal(org.status, 2n); // APPROVED
    assert.equal(await registry.isOrganizationActive(bank.address), true);
    assert.equal(await registry.hasRole(BANK_ROLE, bank.address), true);
  });

  it("allows regulator to revoke an organization permanently", async function () {
    const { registry, deployer, bank, BANK_ROLE } = fixture;
    await registry.connect(bank).registerOrganization("Test Bank", BANK_ROLE);
    await registry.connect(deployer).approveOrganization(bank.address);

    await registry.connect(deployer).revokeOrganization(bank.address);
    const org = await registry.organizations(bank.address);
    assert.equal(org.status, 4n); // REVOKED
    assert.equal(await registry.isOrganizationActive(bank.address), false);
    assert.equal(await registry.hasRole(BANK_ROLE, bank.address), false);

    await expectRevertWithName(registry.connect(deployer).approveOrganization(bank.address), "InvalidStatusTransition");
  });
});
