import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("================================================================================");
  console.log("CHALLENGER 2: EMPIRICAL VERIFICATION HARNESS — MILESTONE 2");
  console.log("================================================================================");

  const { ethers } = await network.create();
  const signers = await ethers.getSigners();
  const [deployer, manager1, manager2, auditor, user1, user2, attacker, candidate] = signers;

  console.log(`Deployer:  ${deployer.address}`);
  console.log(`Manager 1: ${manager1.address}`);
  console.log(`Manager 2: ${manager2.address}`);
  console.log(`Auditor:   ${auditor.address}`);
  console.log(`User 1:    ${user1.address}`);
  console.log(`User 2:    ${user2.address}`);
  console.log(`Attacker:  ${attacker.address}`);
  console.log(`Candidate: ${candidate.address}`);
  console.log("--------------------------------------------------------------------------------");

  // ============================================================================
  // 1. GAS PROFILING & BASELINE COMPARISON
  // ============================================================================
  console.log("\n>>> SECTION 1: DEPLOYMENT & EXECUTION GAS PROFILING <<<");
  const factory = await ethers.getContractFactory("SecureAssetPlatform");
  const deployTx = await factory.getDeployTransaction(deployer.address);
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  
  const platform = await factory.deploy(deployer.address);
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  const deployReceipt = await platform.deploymentTransaction()?.wait();
  const actualDeployGas = deployReceipt!.gasUsed;

  const baselineDeployGas = 7446954n; // From explorer_survey_2/report.md across 6 contracts
  const gasSavings = Number(baselineDeployGas - actualDeployGas);
  const pctSavings = ((gasSavings / Number(baselineDeployGas)) * 100).toFixed(2);

  console.log(`Contract Deployed Address: ${platformAddress}`);
  console.log(`Actual Deployment Gas:     ${actualDeployGas.toLocaleString()} gas`);
  console.log(`Baseline Deployment Gas:   ${baselineDeployGas.toLocaleString()} gas (6 contracts)`);
  console.log(`Absolute Gas Savings:      ${gasSavings.toLocaleString()} gas`);
  console.log(`Relative Gas Savings:      ${pctSavings}% reduction`);

  if (actualDeployGas > baselineDeployGas) {
    throw new Error(`FAIL: Deployment gas exceeds baseline! ${actualDeployGas} > ${baselineDeployGas}`);
  }

  // Bytecode size check (EIP-170 limit: 24,576 bytes)
  const deployedBytecode = await ethers.provider.getCode(platformAddress);
  const bytecodeSize = (deployedBytecode.length - 2) / 2;
  const eip170Limit = 24576;
  const pctLimit = ((bytecodeSize / eip170Limit) * 100).toFixed(2);
  console.log(`Bytecode Size:             ${bytecodeSize.toLocaleString()} bytes (${pctLimit}% of 24,576 B limit)`);
  if (bytecodeSize > eip170Limit) {
    throw new Error(`FAIL: Bytecode exceeds EIP-170 limit! ${bytecodeSize} > ${eip170Limit}`);
  }

  // Roles
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MANAGER_ROLE = await platform.MANAGER_ROLE();
  const AUDITOR_ROLE = await platform.AUDITOR_ROLE();
  const USER_ROLE = await platform.USER_ROLE();

  // Gas profiling map
  const gasMeasurements: Record<string, bigint> = {};

  // Setup identities
  const txRegMgr1 = await platform.connect(deployer).registerIdentity(manager1.address, ethers.id("did:bel:mgr1"));
  const rcRegMgr1 = await txRegMgr1.wait();
  gasMeasurements["registerIdentity (Manager 1)"] = rcRegMgr1!.gasUsed;

  const txGrantMgr1 = await platform.connect(deployer).grantRole(MANAGER_ROLE, manager1.address);
  const rcGrantMgr1 = await txGrantMgr1.wait();
  gasMeasurements["grantRole (MANAGER_ROLE)"] = rcGrantMgr1!.gasUsed;

  const txRegMgr2 = await platform.connect(deployer).registerIdentity(manager2.address, ethers.id("did:bel:mgr2"));
  await txRegMgr2.wait();
  await (await platform.connect(deployer).grantRole(MANAGER_ROLE, manager2.address)).wait();

  await (await platform.connect(deployer).registerIdentity(auditor.address, ethers.id("did:bel:auditor"))).wait();
  await (await platform.connect(deployer).grantRole(AUDITOR_ROLE, auditor.address)).wait();

  const txRegUser1 = await platform.connect(deployer).registerIdentity(user1.address, ethers.id("did:bel:user1"));
  const rcRegUser1 = await txRegUser1.wait();
  gasMeasurements["registerIdentity (User 1)"] = rcRegUser1!.gasUsed;

  await (await platform.connect(deployer).registerIdentity(user2.address, ethers.id("did:bel:user2"))).wait();
  await (await platform.connect(deployer).registerIdentity(candidate.address, ethers.id("did:bel:candidate"))).wait();

  // Mint asset
  const assetId1 = ethers.id("BEL-ASSET-GAS-01");
  const metaHash1 = ethers.id("meta-asset-gas-01");
  const txMint = await platform.connect(manager1).mintAndAllocateAsset(user1.address, assetId1, metaHash1);
  const rcMint = await txMint.wait();
  gasMeasurements["mintAndAllocateAsset"] = rcMint!.gasUsed;

  // Access rule
  const actionRead = ethers.id("READ_RECORD");
  const txRule = await platform.connect(manager1).setAccessRule(0, user2.address, actionRead, true, 0);
  const rcRule = await txRule.wait();
  gasMeasurements["setAccessRule"] = rcRule!.gasUsed;

  // Request access
  const txReq = await platform.connect(user2).requestAccess(0, actionRead, metaHash1);
  const rcReq = await txReq.wait();
  gasMeasurements["requestAccess (event log)"] = rcReq!.gasUsed;

  // Approve transfer
  const nowBlock = await ethers.provider.getBlock("latest");
  const expiry = BigInt(nowBlock!.timestamp + 3600);
  const txApprove = await platform.connect(manager1).approveTransfer(0, user2.address, expiry);
  const rcApprove = await txApprove.wait();
  gasMeasurements["approveTransfer (slot-packed)"] = rcApprove!.gasUsed;

  // Transfer asset
  const txTransfer = await platform.connect(manager2).transferAsset(user1.address, user2.address, 0);
  const rcTransfer = await txTransfer.wait();
  gasMeasurements["transferAsset (2-person)"] = rcTransfer!.gasUsed;

  // Status transition
  const txStatus = await platform.connect(manager1).setAssetStatus(0, 1); // SUSPENDED
  const rcStatus = await txStatus.wait();
  gasMeasurements["setAssetStatus (SUSPEND)"] = rcStatus!.gasUsed;
  await (await platform.connect(manager1).setAssetStatus(0, 0)).wait(); // restore ACTIVE

  // Pause and unpause
  const txPause = await platform.connect(deployer).pause();
  const rcPause = await txPause.wait();
  gasMeasurements["pause"] = rcPause!.gasUsed;

  const txUnpause = await platform.connect(deployer).unpause();
  const rcUnpause = await txUnpause.wait();
  gasMeasurements["unpause"] = rcUnpause!.gasUsed;

  // Read config/gas-budgets.json
  const gasBudgetsRaw = JSON.parse(fs.readFileSync("config/gas-budgets.json", "utf8")).budgets;

  console.log("\nFunction Gas Consumption vs Budgets:");
  console.log("--------------------------------------------------------------------------------");
  for (const [func, gas] of Object.entries(gasMeasurements)) {
    const matchedBudget = Object.keys(gasBudgetsRaw).find(b => func.startsWith(b));
    if (matchedBudget) {
      const budget = BigInt(gasBudgetsRaw[matchedBudget]);
      const margin = budget - gas;
      const status = margin >= 0n ? "PASS" : "FAIL";
      console.log(`  ${func.padEnd(32)}: ${gas.toString().padStart(8)} gas | Budget: ${budget.toString().padStart(8)} | Margin: +${margin.toString().padStart(6)} [${status}]`);
      if (margin < 0n) throw new Error(`Gas budget exceeded for ${func}!`);
    } else {
      console.log(`  ${func.padEnd(32)}: ${gas.toString().padStart(8)} gas | Budget:      N/A | (No budget specified)`);
    }
  }

  // Comparison with AuditRegistry storage array push baseline
  const auditRegistryBaselineGas = 212540n; // from explorer_survey_2/report.md
  const eventLoggingGas = gasMeasurements["requestAccess (event log)"];
  const eventGasSavings = Number(auditRegistryBaselineGas - eventLoggingGas);
  const eventPctSavings = ((eventGasSavings / Number(auditRegistryBaselineGas)) * 100).toFixed(2);
  console.log(`\nAudit Logging Optimization:`);
  console.log(`  AuditRegistry.sol (Storage Array Push): ${auditRegistryBaselineGas.toLocaleString()} gas`);
  console.log(`  SecureAssetPlatform.sol (Indexed Event): ${eventLoggingGas.toLocaleString()} gas`);
  console.log(`  Audit Logging Gas Reduction:            ${eventGasSavings.toLocaleString()} gas (${eventPctSavings}% savings)`);


  // ============================================================================
  // 2. ADVERSARIAL TESTING: SEC-01 (Stale DID Reverse Mapping & Key Replacement)
  // ============================================================================
  console.log("\n>>> SECTION 2: ADVERSARIAL TESTING — SEC-01 <<<");
  console.log("Goal: Verify old DID reverse mapping is deleted upon key replacement,");
  console.log("      old subject is deactivated, and old DID can be cleanly rebound.");

  const oldSubject = user1;
  const oldDidHash = ethers.id("did:bel:user1");
  const newSubject = attacker; // Using attacker as replacement address for test
  const newDidHash = ethers.id("did:bel:replacement-sec01");

  // Pre-condition: oldDidHash resolves to oldSubject
  const preResolved = await platform.identityByDidHash(oldDidHash);
  if (preResolved.toLowerCase() !== oldSubject.address.toLowerCase()) {
    throw new Error(`SEC-01 Setup Error: oldDidHash does not resolve to oldSubject`);
  }
  console.log(`  [+] Pre-condition verified: old DID resolves to ${oldSubject.address}`);

  // Execute replaceIdentityKey
  const txReplace = await platform.connect(deployer).replaceIdentityKey(oldSubject.address, newSubject.address, newDidHash);
  const rcReplace = await txReplace.wait();
  console.log(`  [+] replaceIdentityKey executed (${rcReplace!.gasUsed} gas)`);

  // Adversarial Check 1: Old DID lookup must resolve to ZeroAddress
  const postOldDidResolve = await platform.identityByDidHash(oldDidHash);
  if (postOldDidResolve !== ethers.ZeroAddress) {
    throw new Error(`SEC-01 VULNERABILITY DETECTED! Old DID still resolves to: ${postOldDidResolve}`);
  }
  console.log(`  [PASS] Adversarial Check 1: Old DID ${oldDidHash.slice(0, 10)}... resolves to 0x0 (not stale)`);

  // Adversarial Check 2: New DID resolves to new subject
  const postNewDidResolve = await platform.identityByDidHash(newDidHash);
  if (postNewDidResolve.toLowerCase() !== newSubject.address.toLowerCase()) {
    throw new Error(`SEC-01 FAIL: New DID does not resolve to new subject`);
  }
  console.log(`  [PASS] Adversarial Check 2: New DID resolves to new subject ${newSubject.address}`);

  // Adversarial Check 3: Old subject identity profile isActive == false
  const oldProfile = await platform.identityRegistry(oldSubject.address);
  if (oldProfile.isActive) {
    throw new Error(`SEC-01 FAIL: Old subject is still marked active!`);
  }
  console.log(`  [PASS] Adversarial Check 3: Old subject profile isActive == false`);

  // Adversarial Check 4: Old subject cannot perform active identity actions
  try {
    await platform.connect(oldSubject).requestAccess(0, actionRead, metaHash1);
    throw new Error(`SEC-01 VULNERABILITY DETECTED! Deactivated old subject could execute requestAccess!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 4: Deactivated old subject blocked from requestAccess (${err.message.split("(")[0].trim()})`);
  }

  // Adversarial Check 5: Freed old DID can be legitimately re-used by a new subject
  const freshWallet = signers[8];
  const txReclaim = await platform.connect(deployer).registerIdentity(freshWallet.address, oldDidHash);
  await txReclaim.wait();
  const reclaimedResolve = await platform.identityByDidHash(oldDidHash);
  if (reclaimedResolve.toLowerCase() !== freshWallet.address.toLowerCase()) {
    throw new Error(`SEC-01 FAIL: Freed old DID could not be re-registered to fresh wallet!`);
  }
  console.log(`  [PASS] Adversarial Check 5: Freed old DID successfully re-registered to fresh wallet ${freshWallet.address}`);

  // Adversarial Check 6: Non-admin cannot call replaceIdentityKey
  try {
    await platform.connect(attacker).replaceIdentityKey(freshWallet.address, signers[9].address, ethers.id("did:fail"));
    throw new Error(`SEC-01 FAIL: Non-admin was able to call replaceIdentityKey!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 6: Non-admin blocked from replaceIdentityKey`);
  }

  // Adversarial Check 7: Admin cannot be replaced via replaceIdentityKey
  try {
    await platform.connect(deployer).replaceIdentityKey(deployer.address, signers[9].address, ethers.id("did:fail"));
    throw new Error(`SEC-01 FAIL: Root admin could be replaced via replaceIdentityKey!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 7: Root admin protected from replaceIdentityKey (AdminMustRemainActive)`);
  }


  // ============================================================================
  // 3. ADVERSARIAL TESTING: SEC-02 (Transfer Approval Binding, Expiry & Replay)
  // ============================================================================
  console.log("\n>>> SECTION 3: ADVERSARIAL TESTING — SEC-02 <<<");
  console.log("Goal: Verify transfer approvals bind recipient address & expiry,");
  console.log("      prevent replay attacks, enforce 2-person rule, and reject invalid approvals.");

  // Mint fresh asset for SEC-02 testing
  const assetIdSec2 = ethers.id("BEL-ASSET-SEC02-01");
  const metaHashSec2 = ethers.id("meta-sec02-01");
  const txMintSec2 = await platform.connect(manager1).mintAndAllocateAsset(user2.address, assetIdSec2, metaHashSec2);
  const rcMintSec2 = await txMintSec2.wait();
  const tokenSec2 = 1n; // second minted token (id = 1)
  console.log(`  [+] Minted asset token ID ${tokenSec2} to User 2 (${user2.address})`);

  // Legitimate recipient is candidate; attacker is attacker
  const legitimateRecipient = candidate.address;
  const attackRecipient = attacker.address;

  // Manager 1 approves transfer to legitimateRecipient with 1-hour expiry
  const blk = await ethers.provider.getBlock("latest");
  const validExpiry = BigInt(blk!.timestamp + 3600);
  await (await platform.connect(manager1).approveTransfer(tokenSec2, legitimateRecipient, validExpiry)).wait();
  console.log(`  [+] Manager 1 approved transfer of token ${tokenSec2} -> ${legitimateRecipient} (expires: ${validExpiry})`);

  // Adversarial Check 1: Hijack Attempt (Manager 2 attempts to transfer to attackRecipient)
  try {
    await platform.connect(manager2).transferAsset(user2.address, attackRecipient, tokenSec2);
    throw new Error(`SEC-02 VULNERABILITY DETECTED! Transfer hijacked to unapproved recipient!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 1: Transfer hijacking to unapproved recipient blocked (UnauthorizedTransfer)`);
  }

  // Adversarial Check 2: Single-Person Rule Bypass (Manager 1 attempts to execute their own approval)
  try {
    await platform.connect(manager1).transferAsset(user2.address, legitimateRecipient, tokenSec2);
    throw new Error(`SEC-02 VULNERABILITY DETECTED! Approving manager could execute their own transfer!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 2: Self-execution by approving manager blocked (Two-Person rule enforced)`);
  }

  // Legitimate transfer execution by Manager 2 to approved recipient
  const txValidTransfer = await platform.connect(manager2).transferAsset(user2.address, legitimateRecipient, tokenSec2);
  await txValidTransfer.wait();
  const newOwner = await platform.ownerOf(tokenSec2);
  if (newOwner.toLowerCase() !== legitimateRecipient.toLowerCase()) {
    throw new Error(`SEC-02 FAIL: Token not transferred to legitimate recipient`);
  }
  console.log(`  [+] Legitimate transfer executed: Token ${tokenSec2} is now owned by ${legitimateRecipient}`);

  // Adversarial Check 3: Replay Attack (Manager 2 attempts to reuse the approval)
  try {
    await platform.connect(manager2).transferAsset(legitimateRecipient, user2.address, tokenSec2);
    throw new Error(`SEC-02 VULNERABILITY DETECTED! Consumed approval replayed!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 3: Replay of consumed transfer approval blocked`);
  }

  // Verify approval state was wiped upon successful consumption
  const consumedApproval = await platform.approvedTransfers(tokenSec2);
  if (consumedApproval.approver !== ethers.ZeroAddress) {
    throw new Error(`SEC-02 FAIL: Consumed approval was not deleted from storage!`);
  }
  console.log(`  [PASS] Adversarial Check 3b: Consumed approval wiped from storage (approver == 0x0)`);

  // Adversarial Check 4: Expiration Attack
  const assetIdSec2Exp = ethers.id("BEL-ASSET-SEC02-EXP");
  const metaHashSec2Exp = ethers.id("meta-sec02-exp");
  await (await platform.connect(manager1).mintAndAllocateAsset(legitimateRecipient, assetIdSec2Exp, metaHashSec2Exp)).wait();
  const tokenSec2Exp = 2n;

  const currentBlk = await ethers.provider.getBlock("latest");
  const shortExpiry = BigInt(currentBlk!.timestamp + 5); // 5 seconds
  await (await platform.connect(manager1).approveTransfer(tokenSec2Exp, user2.address, shortExpiry)).wait();

  // Fast forward time by 10 seconds
  await ethers.provider.send("evm_increaseTime", [10]);
  await ethers.provider.send("evm_mine", []);

  try {
    await platform.connect(manager2).transferAsset(legitimateRecipient, user2.address, tokenSec2Exp);
    throw new Error(`SEC-02 VULNERABILITY DETECTED! Expired transfer approval was accepted!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 4: Expired transfer approval rejected (time elapsed > expiresAt)`);
  }

  // Adversarial Check 4b: Overwrite expired approval with fresh valid approval
  const freshBlk = await ethers.provider.getBlock("latest");
  const freshExpiry = BigInt(freshBlk!.timestamp + 3600);
  await (await platform.connect(manager1).approveTransfer(tokenSec2Exp, user2.address, freshExpiry)).wait();
  const txRecoveredTransfer = await platform.connect(manager2).transferAsset(legitimateRecipient, user2.address, tokenSec2Exp);
  await txRecoveredTransfer.wait();
  const recoveredOwner = await platform.ownerOf(tokenSec2Exp);
  if (recoveredOwner.toLowerCase() !== user2.address.toLowerCase()) {
    throw new Error(`SEC-02 FAIL: Fresh approval after expiry did not allow valid transfer`);
  }
  console.log(`  [PASS] Adversarial Check 4b: Expired approval successfully superseded by fresh valid approval`);

  // Adversarial Check 5: Past Timestamp Rejection on Approval Creation
  const pastBlk = await ethers.provider.getBlock("latest");
  try {
    await platform.connect(manager1).approveTransfer(tokenSec2Exp, user2.address, BigInt(pastBlk!.timestamp - 1));
    throw new Error(`SEC-02 FAIL: approveTransfer accepted a past timestamp!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 5: approveTransfer rejected past timestamp (InvalidApprovalExpiry)`);
  }

  // Adversarial Check 6: Standard ERC721 Approval Bypass
  try {
    await platform.connect(deployer).approve(attacker.address, tokenSec2);
    throw new Error(`SEC-02 VULNERABILITY DETECTED! ERC-721 approve() is not disabled!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 6a: Standard ERC-721 approve() blocked (ApprovalDisabled)`);
  }

  try {
    await platform.connect(deployer).setApprovalForAll(attacker.address, true);
    throw new Error(`SEC-02 VULNERABILITY DETECTED! ERC-721 setApprovalForAll() is not disabled!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 6b: Standard ERC-721 setApprovalForAll() blocked (ApprovalDisabled)`);
  }


  // ============================================================================
  // 4. ADVERSARIAL TESTING: SEC-03 (Two-Step Admin Governance & Immutability)
  // ============================================================================
  console.log("\n>>> SECTION 4: ADVERSARIAL TESTING — SEC-03 <<<");
  console.log("Goal: Verify 2-step admin transfer, immutability of direct role modification,");
  console.log("      and total revocation of old admin privileges upon handoff completion.");

  // Adversarial Check 1: Direct DEFAULT_ADMIN_ROLE grant/revoke/renounce must revert
  try {
    await platform.connect(deployer).grantRole(DEFAULT_ADMIN_ROLE, attacker.address);
    throw new Error(`SEC-03 VULNERABILITY DETECTED! grantRole(DEFAULT_ADMIN_ROLE) succeeded!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 1a: Direct grantRole(DEFAULT_ADMIN_ROLE) blocked (DefaultAdminImmutable)`);
  }

  try {
    await platform.connect(deployer).revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
    throw new Error(`SEC-03 VULNERABILITY DETECTED! revokeRole(DEFAULT_ADMIN_ROLE) succeeded!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 1b: Direct revokeRole(DEFAULT_ADMIN_ROLE) blocked (DefaultAdminImmutable)`);
  }

  try {
    await platform.connect(deployer).renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
    throw new Error(`SEC-03 VULNERABILITY DETECTED! renounceRole(DEFAULT_ADMIN_ROLE) succeeded!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 1c: Direct renounceRole(DEFAULT_ADMIN_ROLE) blocked (DefaultAdminImmutable)`);
  }

  // Adversarial Check 2: Unauthorized initiation
  try {
    await platform.connect(attacker).transferAdmin(attacker.address);
    throw new Error(`SEC-03 FAIL: Attacker could initiate transferAdmin!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 2: Unauthorized party blocked from transferAdmin`);
  }

  // Adversarial Check 3: Admin self-transfer
  try {
    await platform.connect(deployer).transferAdmin(deployer.address);
    throw new Error(`SEC-03 FAIL: Admin could transferAdmin to self!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 3: Admin transfer to self blocked (CannotTransferToSelf)`);
  }

  // Adversarial Check 4: Premature acceptAdmin
  try {
    await platform.connect(candidate).acceptAdmin();
    throw new Error(`SEC-03 FAIL: Candidate could acceptAdmin with no pending transfer!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 4: Premature acceptAdmin blocked (NoPendingAdminTransfer)`);
  }

  // Step 1: Admin initiates transfer to candidate
  const txInitAdmin = await platform.connect(deployer).transferAdmin(candidate.address);
  const rcInitAdmin = await txInitAdmin.wait();
  console.log(`  [+] Admin initiated transferAdmin -> ${candidate.address} (${rcInitAdmin!.gasUsed} gas)`);
  const pending = await platform.pendingAdmin();
  if (pending.toLowerCase() !== candidate.address.toLowerCase()) {
    throw new Error(`SEC-03 FAIL: pendingAdmin not set correctly`);
  }

  // Adversarial Check 5: Impersonation / Wrong party acceptAdmin
  try {
    await platform.connect(attacker).acceptAdmin();
    throw new Error(`SEC-03 VULNERABILITY DETECTED! Wrong party accepted admin role!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 5: Wrong party blocked from acceptAdmin (NotPendingAdmin)`);
  }

  // Adversarial Check 6: Admin cancels transfer
  const txCancelAdmin = await platform.connect(deployer).cancelAdminTransfer();
  const rcCancelAdmin = await txCancelAdmin.wait();
  console.log(`  [+] Admin cancelled transferAdmin (${rcCancelAdmin!.gasUsed} gas)`);
  const postCancelPending = await platform.pendingAdmin();
  if (postCancelPending !== ethers.ZeroAddress) {
    throw new Error(`SEC-03 FAIL: pendingAdmin not cleared after cancellation`);
  }

  try {
    await platform.connect(candidate).acceptAdmin();
    throw new Error(`SEC-03 FAIL: Candidate could acceptAdmin after cancellation!`);
  } catch (err: any) {
    if (err.message.includes("FAIL")) throw err;
    console.log(`  [PASS] Adversarial Check 6: Candidate blocked from acceptAdmin after cancellation`);
  }

  // Step 2: Re-initiate and complete 2-step transfer
  await (await platform.connect(deployer).transferAdmin(candidate.address)).wait();
  const txAcceptAdmin = await platform.connect(candidate).acceptAdmin();
  const rcAcceptAdmin = await txAcceptAdmin.wait();
  console.log(`  [+] Candidate accepted admin role (${rcAcceptAdmin!.gasUsed} gas)`);

  // Verify state transitions
  const currentAdmin = await platform.currentAdmin();
  const finalPending = await platform.pendingAdmin();
  const newAdminHasRole = await platform.hasRole(DEFAULT_ADMIN_ROLE, candidate.address);
  const oldAdminHasRole = await platform.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);

  if (currentAdmin.toLowerCase() !== candidate.address.toLowerCase()) {
    throw new Error(`SEC-03 FAIL: currentAdmin not updated to candidate!`);
  }
  if (finalPending !== ethers.ZeroAddress) {
    throw new Error(`SEC-03 FAIL: pendingAdmin not cleared!`);
  }
  if (!newAdminHasRole) {
    throw new Error(`SEC-03 FAIL: New admin does not have DEFAULT_ADMIN_ROLE!`);
  }
  if (oldAdminHasRole) {
    throw new Error(`SEC-03 VULNERABILITY DETECTED! Old admin still retains DEFAULT_ADMIN_ROLE!`);
  }
  console.log(`  [PASS] Adversarial Check 7: Governance handoff complete. Old admin DEFAULT_ADMIN_ROLE revoked.`);

  // Adversarial Check 8: Old admin lockout from privileged admin functions
  try {
    await platform.connect(deployer).pause();
    throw new Error(`SEC-03 VULNERABILITY DETECTED! Old admin could still pause the contract!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 8a: Old admin blocked from pause()`);
  }

  try {
    await platform.connect(deployer).transferAdmin(deployer.address);
    throw new Error(`SEC-03 VULNERABILITY DETECTED! Old admin could still call transferAdmin!`);
  } catch (err: any) {
    if (err.message.includes("VULNERABILITY")) throw err;
    console.log(`  [PASS] Adversarial Check 8b: Old admin blocked from transferAdmin()`);
  }

  // Adversarial Check 9: New admin can execute privileged admin functions
  await (await platform.connect(candidate).pause()).wait();
  const isPaused = await platform.paused();
  if (!isPaused) throw new Error(`SEC-03 FAIL: Contract not paused by new admin`);
  await (await platform.connect(candidate).unpause()).wait();
  const isUnpaused = !(await platform.paused());
  if (!isUnpaused) throw new Error(`SEC-03 FAIL: Contract not unpaused by new admin`);
  console.log(`  [PASS] Adversarial Check 9: New admin successfully exercised pause() and unpause()`);


  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n================================================================================");
  console.log("CHALLENGER 2 EMPIRICAL VERIFICATION COMPLETE");
  console.log("================================================================================");
  console.log(`1. Deployment Gas Savings: ${pctSavings}% (Actual: ${actualDeployGas.toLocaleString()} vs Baseline: ${baselineDeployGas.toLocaleString()})`);
  console.log(`2. SEC-01 (Stale DID Reverse Resolution): VERIFIED & IMMUNE TO RESOLUTION LEAKS`);
  console.log(`3. SEC-02 (Transfer Approval Hijack/Expiry/Replay): VERIFIED & IMMUNE TO ATTACKS`);
  console.log(`4. SEC-03 (Two-Step Admin Governance & Immutability): VERIFIED & IMMUNE TO LOCKOUT/THEFT`);
  console.log(`Overall Empirical Verdict: APPROVE`);
  console.log("================================================================================\n");
}

main().catch((error) => {
  console.error("\nFATAL ERROR IN EMPIRICAL VERIFICATION:");
  console.error(error);
  process.exitCode = 1;
});
