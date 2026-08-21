# Problem Statement 26125 Traceability Matrix

## Scope

This matrix maps the supplied Smart India Hackathon 2026 Problem Statement 26125, the attached Bharat Electronics Limited architecture proposal, and the attached **SIH 2026 – Problem Statement 26125: Mistakes, Technical Issues & Solutions** review to repository evidence. It distinguishes a documented design from an implemented, tested, and deployment-ready capability.

## Requirement traceability

| ID | Requirement | Repository evidence | Current status | Completion evidence still required |
|---|---|---|---|---|
| PS-01 | Replace centralized identity dependence with decentralized, cryptographically verifiable identity | ECDSA/secp256k1 EVM authentication; blockchain-backed DID hash registry; lifecycle tests | **MVP baseline implemented** | Approved DID method, credential/resolution tests, and identity assurance review |
| PS-02 | Assign each user a decentralized identifier independent of a centralized authority | `registerIdentity`, `IdentityProfile.didHash`, `replaceIdentityKey` | **Partially implemented** | DID-document/verification-method design and organizational verification authority |
| PS-03 | Represent unique digital assets as NFTs | ERC-721 `SecureAssetPlatform`; unique token IDs; `mintAndAllocateAsset` | **MVP baseline implemented** | Independent contract review and approved deployment artifact |
| PS-04 | Link NFTs to identities with verifiable ownership | `AssetMintedAndAllocated`; ERC-721 ownership; independent verification fields | **MVP baseline implemented** | Published ABI, deployment record, and auditor verification tool |
| PS-05 | Allow only authorized administrators or managers to mint and allocate assets | `MANAGER_ROLE`, active checks, negative mint tests | **MVP baseline implemented** | Multisig/institutional custody, role graph review, and deployment controls |
| PS-06 | Enforce Admin, Manager, Auditor, and User RBAC | Explicit role constants, default-admin role administration, grant/revoke checks, lifecycle tests | **MVP baseline implemented** | Tenant/asset scope decision, fuzz/invariant tests, and independent review |
| PS-07 | Enforce permissions automatically through smart contracts | `onlyRole`, `onlyActiveIdentity`, manager-only transfers, disabled approvals, pause state | **MVP baseline implemented** | Fuzz/invariant tests and independent smart-contract review |
| PS-08 | Record identity, asset, role, permission, and transfer changes immutably | Structured identity, key-replacement, asset, access-decision, pause, ERC-721, and AccessControl events | **Partially implemented** | Event schema, indexer, confirmation/reorg policy, reconciliation, and audit export |
| PS-09 | Provide transparent ownership, authenticity, permission, and transaction history | Contract state/events; architecture verification flow; acceptance criteria | **Partially implemented** | API/indexer/read model and auditor dashboard |
| PS-10 | Protect digital and physical asset metadata | Fixed-size metadata hash; architecture requires AES-256 encryption before IPFS/object storage; key-wrapping design | **Partially implemented** | Encryption/storage service, KMS/HSM integration decision, revocation, retention, and availability tests |
| PS-11 | Prevent unauthorized reassignment and duplicate real-world registration | Unique organizational `assetId` mapping, duplicate rejection, manager-only transfer, approvals disabled | **MVP baseline implemented** | Physical-asset registration system, QR/NFC verification, and recovery/offboarding workflow |
| PS-12 | Support tamper-evident auditability without exposing sensitive data | Structured events, explicit non-reverting `AccessDecision`, data-minimization rules | **Partially implemented** | Indexer, transaction-status service, privacy review, monitoring, and incident response |
| PS-13 | Support enterprise network and deployment governance | ADR 0002 selects local EVM for MVP and defers production network choice | **MVP decision recorded** | Approved permissioned network, validator/operator governance, finality, privacy, and residency evidence |
| PS-14 | Provide user/operator access through client and wallet/identity adapter | EVM wallet boundary and acceptance flows documented; no client implementation | **Not evidenced** | Web/mobile client, wallet protocol, accessibility review, and end-to-end tests |
| PS-15 | Bind NFT records to physical assets without claiming token ownership is legal title | Architecture requires organizational asset ID and QR/NFC tag; README distinguishes token/physical/legal ownership | **Design complete** | QR/NFC verifier and organizational asset registry |
| PS-16 | Define employee offboarding and key-loss recovery | `offboardIdentity` and `setIdentityStatus` revoke roles; `replaceIdentityKey` suspends old key and migrates operational roles; threat model and acceptance criteria | **MVP baseline implemented** | HR/identity approval workflow, asset review/reassignment, recovery ceremony, and audit export |

## Attached SIH issue coverage

| Issue | Implemented or documented correction | Evidence | Status |
|---|---|---|---|
| 1, 19 | ERC-721 ownership boundary enforces active identities; standard approval paths are disabled; transfer is manager-only | `contracts/SecureAssetPlatform.sol`, transfer tests | **Fixed for MVP** |
| 2 | Owner access is separate from transfer authority; only managers transfer | `transferAsset`, `transferFrom`, `safeTransferFrom` | **Fixed for MVP** |
| 3, 17, 18 | Explicit structured `AccessDecision`, identity, asset, key, role, pause, and transfer events replace failed-revert logging assumptions | Contract events, `ARCHITECTURE.md`, `docs/THREAT-MODEL.md` | **Fixed for MVP; indexer pending** |
| 4, 20 | Deactivation/offboarding revokes operational roles; key replacement suspends old identity; asset reassignment remains an explicit manager review | `offboardIdentity`, `setIdentityStatus`, `replaceIdentityKey`, acceptance criteria | **Fixed for MVP; enterprise workflow pending** |
| 5 | Duplicate registration is rejected; key replacement is separate | `IdentityAlreadyRegistered`, lifecycle test | **Fixed for MVP** |
| 6 | Documentation calls this a blockchain-backed DID registry/reference, not complete SSI | `ARCHITECTURE.md`, README | **Fixed in claims** |
| 7 | MVP selects ECDSA/secp256k1; Ed25519 is not claimed as implemented | ADR 0002, architecture | **Fixed in claims** |
| 8 | Deactivation revokes on-chain authorization; it does not destroy private keys | Contract lifecycle and security docs | **Fixed in claims** |
| 9, 10, 11, 28, 29 | Architecture requires AES-256 before IPFS, treats CID as a multihash-based content identifier, separates key wrapping, states post-decryption leakage limits, and defers KMS/HSM to production | Architecture, threat model, acceptance criteria | **Fixed in design; storage implementation pending** |
| 12 | Unique organizational asset ID is required and duplicate IDs revert | `assetIdExists`, mint test | **Fixed for MVP** |
| 13 | Physical ownership is not inferred from NFT ownership; QR/NFC and organizational registration are required | Architecture, traceability matrix | **Design complete; verifier pending** |
| 14, 15 | Default admin is not expanded/revoked through ordinary role calls; operational roles are separately granted and tested | Role administration, tests, ADR 0002 | **Fixed for MVP; multisig pending** |
| 16 | `AUDITOR_ROLE` controls explicit access-decision reads at the contract boundary; dashboard/indexer remains pending | `requestAccess`, tests, acceptance criteria | **Fixed for MVP; dashboard pending** |
| 21 | Controlled replacement-key workflow exists and old identity is suspended | `replaceIdentityKey`, lifecycle test | **Fixed for MVP; organizational recovery pending** |
| 22 | Documentation uses controlled/predictable cost language and does not promise zero fees | README, architecture, ADR 0002 | **Fixed in claims** |
| 23, 24 | MVP commits to local Hardhat EVM, Solidity, OpenZeppelin, and ERC-721; permissioned network/ERC-1155 are future decisions | ADR 0002, roadmap | **Fixed for MVP** |
| 25 | Repository and contract are labeled prototype/MVP and explicitly not production-audited | README, SECURITY.md, compliance report, contract notice | **Fixed in claims** |
| 26 | OpenZeppelin `Pausable` emergency controls are implemented and tested | `pause`, `unpause`, test | **Fixed for MVP** |
| 27 | NFT ownership and access permission are explicitly separate; access decision is non-reverting and role-aware | Architecture, `requestAccess`, `AccessDecision` | **Fixed for MVP; off-chain retrieval policy pending** |
| 30 | Roadmap prioritizes wallet/DID, RBAC, encrypted storage, ERC-721, controlled access, and structured audit; QR/NFC and multisig are staged later | `ROADMAP.md`, acceptance criteria | **Fixed in scope** |

## Submission interpretation

The repository now provides a **working smart-contract MVP baseline plus traceable architecture, threat-model, acceptance, and governance documentation**. It is suitable for a proposal or controlled local demonstration when accompanied by the stated limitations. It must not be presented as a production deployment, completed security audit, legal ownership system, or BEL-endorsed implementation.

## Acceptance rule

A row may move from **Partially implemented**, **Design complete**, or **Not evidenced** to **Compliant for production** only when the completion evidence is linked from a reviewed pull request, test result, deployment artifact, operational runbook, or approved governance record. Narrative claims alone do not close a requirement.

## References

[1]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
[2]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[3]: https://eips.ethereum.org/EIPS/eip-1155 "ERC-1155 Multi Token Standard"
[4]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[5]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[6]: https://ipfs.tech/ "IPFS documentation and project site"
