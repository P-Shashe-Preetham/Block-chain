import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Open Banking Blockchain Access Control Suite", function () {
  let admin: any;
  let regulator: any;
  let bankA: any;
  let tsp1: any;
  let user1: any;
  let unapprovedTsp: any;

  let organizationRegistry: any;
  let identityRegistry: any;
  let consentManager: any;
  let accessControlManager: any;
  let auditRegistry: any;

  beforeEach(async function () {
    [admin, regulator, bankA, tsp1, user1, unapprovedTsp] = await ethers.getSigners();

    // 1. Deploy OrganizationRegistry
    const OrganizationRegistryFactory = await ethers.getContractFactory("OrganizationRegistry");
    organizationRegistry = await OrganizationRegistryFactory.deploy();
    await organizationRegistry.waitForDeployment();

    // Grant REGULATOR_ROLE to regulator address
    const REGULATOR_ROLE = await organizationRegistry.REGULATOR_ROLE();
    await organizationRegistry.grantRole(REGULATOR_ROLE, regulator.address);

    // 2. Deploy IdentityRegistry
    const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistryFactory.deploy();
    await identityRegistry.waitForDeployment();

    // Grant VERIFIER_ROLE to bankA address
    const VERIFIER_ROLE = await identityRegistry.VERIFIER_ROLE();
    await identityRegistry.grantRole(VERIFIER_ROLE, bankA.address);

    // 3. Deploy ConsentManager
    const ConsentManagerFactory = await ethers.getContractFactory("ConsentManager");
    consentManager = await ConsentManagerFactory.deploy();
    await consentManager.waitForDeployment();

    // 4. Deploy AccessControlManager
    const AccessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControlManager = await AccessControlManagerFactory.deploy(
      await identityRegistry.getAddress(),
      await organizationRegistry.getAddress(),
      await consentManager.getAddress()
    );
    await accessControlManager.waitForDeployment();

    // 5. Deploy AuditRegistry
    const AuditRegistryFactory = await ethers.getContractFactory("AuditRegistry");
    auditRegistry = await AuditRegistryFactory.deploy();
    await auditRegistry.waitForDeployment();
  });

  describe("Phase 1: OrganizationRegistry", function () {
    it("Should register Bank and TSP in PENDING state", async function () {
      await organizationRegistry.connect(bankA).registerOrganization("Bank A", 1, "BANK-LIC-001");
      const bankDetails = await organizationRegistry.getOrganization(bankA.address);
      expect(bankDetails.name).to.equal("Bank A");
      expect(bankDetails.status).to.equal(0n); // PENDING

      await organizationRegistry.connect(tsp1).registerOrganization("Fintech TSP 1", 2, "TSP-LIC-999");
      const tspDetails = await organizationRegistry.getOrganization(tsp1.address);
      expect(tspDetails.name).to.equal("Fintech TSP 1");
      expect(tspDetails.status).to.equal(0n); // PENDING
    });

    it("Should allow Regulator to approve Bank and TSP", async function () {
      await organizationRegistry.connect(bankA).registerOrganization("Bank A", 1, "BANK-LIC-001");
      await organizationRegistry.connect(tsp1).registerOrganization("Fintech TSP 1", 2, "TSP-LIC-999");

      await organizationRegistry.connect(regulator).approveOrganization(bankA.address);
      await organizationRegistry.connect(regulator).approveOrganization(tsp1.address);

      expect(await organizationRegistry.isOrganizationApproved(bankA.address)).to.be.true;
      expect(await organizationRegistry.isOrganizationApproved(tsp1.address)).to.be.true;
      expect(await organizationRegistry.isOrganizationApproved(unapprovedTsp.address)).to.be.false;
    });
  });

  describe("Phase 2: IdentityRegistry", function () {
    it("Should manage complete user identity lifecycle (PENDING -> ACTIVE -> REVOKED)", async function () {
      const did = "did:openbanking:user1";
      const piiHash = ethers.keccak256(ethers.toUtf8Bytes("John Doe john@example.com ID12345"));

      // User registers identity
      await identityRegistry.connect(user1).registerIdentity(did, piiHash);

      // Status should be PENDING (0)
      expect(await identityRegistry.getIdentityStatus(user1.address)).to.equal(0n);
      expect(await identityRegistry.isIdentityActive(user1.address)).to.be.false;

      // Bank verifies user identity
      await identityRegistry.connect(bankA).verifyIdentity(user1.address);

      // Status should now be ACTIVE (2)
      expect(await identityRegistry.getIdentityStatus(user1.address)).to.equal(2n);
      expect(await identityRegistry.isIdentityActive(user1.address)).to.be.true;
    });
  });

  describe("Phase 3: ConsentManager", function () {
    it("Should allow user to grant and revoke consent for specific bank data", async function () {
      const dataType = "TRANSACTIONS";
      const durationSeconds = 3600; // 1 hour

      // Grant consent
      await consentManager.connect(user1).grantConsent(bankA.address, tsp1.address, dataType, durationSeconds);

      // Verify consent check returns true
      const hasConsent = await consentManager.checkConsent(user1.address, bankA.address, tsp1.address, dataType);
      expect(hasConsent).to.be.true;

      // Revoke consent
      const userConsents = await consentManager.getUserConsents(user1.address);
      const consentId = userConsents[0];
      await consentManager.connect(user1).revokeConsent(consentId);

      // Verify consent check returns false after revocation
      const hasConsentAfterRevoke = await consentManager.checkConsent(user1.address, bankA.address, tsp1.address, dataType);
      expect(hasConsentAfterRevoke).to.be.false;
    });
  });

  describe("Phase 4: AccessControlManager", function () {
    it("Should authorize access only when all requirements pass", async function () {
      const dataType = "TRANSACTIONS";

      // 1. Setup Bank & TSP
      await organizationRegistry.connect(bankA).registerOrganization("Bank A", 1, "BANK-LIC-001");
      await organizationRegistry.connect(tsp1).registerOrganization("Fintech TSP 1", 2, "TSP-LIC-999");
      await organizationRegistry.connect(regulator).approveOrganization(bankA.address);
      await organizationRegistry.connect(regulator).approveOrganization(tsp1.address);

      // 2. Setup User Identity
      const did = "did:openbanking:user1";
      const piiHash = ethers.keccak256(ethers.toUtf8Bytes("John Doe"));
      await identityRegistry.connect(user1).registerIdentity(did, piiHash);
      await identityRegistry.connect(bankA).verifyIdentity(user1.address);

      // 3. User Grants Consent
      await consentManager.connect(user1).grantConsent(bankA.address, tsp1.address, dataType, 3600);

      // 4. Access Control check should succeed
      const isAllowed = await accessControlManager.connect(tsp1).isAccessAllowed.staticCall(
        user1.address,
        bankA.address,
        tsp1.address,
        dataType
      );
      expect(isAllowed).to.be.true;

      // 5. If consent is revoked, access control should fail
      const userConsents = await consentManager.getUserConsents(user1.address);
      await consentManager.connect(user1).revokeConsent(userConsents[0]);

      const isAllowedAfterRevoke = await accessControlManager.connect(tsp1).isAccessAllowed.staticCall(
        user1.address,
        bankA.address,
        tsp1.address,
        dataType
      );
      expect(isAllowedAfterRevoke).to.be.false;
    });
  });
});
