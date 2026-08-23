# Problem Statement 26125 Traceability Matrix

## Scope

This matrix maps the supplied Smart India Hackathon 2026 Problem Statement 26125, the attached Bharat Electronics Limited architecture proposal, and the attached **SIH 2026 – Problem Statement 26125: Mistakes, Technical Issues & Solutions** review to repository evidence. It distinguishes a project-owned implementation/test from an external approval, real-world assurance, or production claim. The accepted client direction, contract/data authority, and external gates are recorded in [ADR 0009](ADR/0009-react-vite-web-console-boundary.md), the [decision register](FINAL-PROJECT-DECISION-REGISTER.md), and the [data dictionary](FINAL-PROJECT-DATA-DICTIONARY.md).

## Requirement traceability

| ID | Requirement | Repository evidence | Current status | Completion evidence still required |
|---|---|---|---|---|
| PS-01 | Replace centralized identity dependence with decentralized, cryptographically verifiable identity | EVM account control and a unique on-chain opaque DID-hash registry; lifecycle tests. | **Submission-ready foundation** | Approved DID method/resolver/credential profile, assurance mapping, and identity-owner review. |
| PS-02 | Assign each user a decentralized identifier independent of a centralized authority | `registerIdentity`, `IdentityProfile.didHash`, `identityByDidHash`, `replaceIdentityKey`. | **Partially implemented** | DID document/verification-method design, approved resolver, and organizational verification authority. |
| PS-03 | Represent unique digital assets as NFTs | ERC-721 `SecureAssetPlatform`; unique token IDs; `mintAndAllocateAsset`. | **Submission-ready foundation** | Independent contract review and approved deployment artifact. |
| PS-04 | Link NFTs to identities with verifiable ownership | `AssetMintedAndAllocated`, ERC-721 ownership, contract event/ABI schema, data dictionary. | **Partially implemented** | Published approved deployment record and independent verifier tool. |
| PS-05 | Allow only authorized administrators or managers to mint and allocate assets | `MANAGER_ROLE`, active checks, negative mint tests. | **Submission-ready foundation** | Multisig/institutional custody, role-graph review, and deployment controls. |
| PS-06 | Enforce Admin, Manager, Auditor, and User RBAC | Explicit role constants, default-admin administration, grant/revoke/lifecycle tests. | **Submission-ready foundation** | Tenant/asset scope decision, expanded fuzzing, independent review, and real identity assurance. |
| PS-07 | Enforce permissions automatically through smart contracts | `onlyRole`, `onlyActiveIdentity`, manager-only transfers, disabled approvals, pause state. | **Submission-ready foundation** | Independent smart-contract review and approved deployment controls. |
| PS-08 | Record identity, asset, role, permission, and transfer changes immutably | Structured events, strict ABI decoder, raw-log retention, canonical projection, status/reorg/reconciliation references. | **Partially implemented** | Approved network finality policy, durable scheduled worker, operational backfill/export. |
| PS-09 | Provide transparent ownership, authenticity, permission, and transaction history | Contract state/events, sanitized audit route, projection schema, Evidence Ledger prototype, acceptance scenarios. | **Partially implemented** | Repository-integrated client and independent verifier workflow. |
| PS-10 | Protect digital and physical asset metadata | Fixed-size commitment, AES-256-GCM reference envelope, classification/key-release policy, data-placement rules. | **Partially implemented** | Approved KMS/HSM, storage/availability adapter, malware/DLP, retention, privacy/legal, and recovery evidence. |
| PS-11 | Prevent unauthorized reassignment and duplicate real-world registration | Unique asset-ID mapping, lifecycle gating, manager-only transfer, disabled approvals. | **Submission-ready foundation** | Physical-asset registry, QR/NFC verifier, legal/title and recovery workflow. |
| PS-12 | Support tamper-evident auditability without exposing sensitive data | Structured events, non-reverting `AccessDecision`, redacted audit API, data dictionary, raw-log exclusion. | **Partially implemented** | Real authentication, operational monitoring/incident response, approved export/privacy review. |
| PS-13 | Support enterprise network and deployment governance | Final-project decision register preserves local/CI only and blocks network/custody/finality selection. | **Design and release boundary complete** | Approved network, validator/operator governance, finality, privacy, residency, deployer/multisig evidence. |
| PS-14 | Provide user/operator access through client and wallet/identity adapter | ADR 0009 accepts repository-native Vite/React client boundary; external Evidence Ledger is a non-repository UI prototype. | **Direction accepted; implementation not evidenced** | `apps/web/`, approved identity adapter, accessibility/E2E/i18n evidence, and verifier UI/CLI. |
| PS-15 | Bind NFT records to physical assets without claiming token ownership is legal title | Opaque organizational asset commitment; documentation separates token, physical, and legal ownership. | **Design complete** | QR/NFC verifier, organizational asset registry, legal/title process. |
| PS-16 | Define employee offboarding and key-loss recovery | `offboardIdentity`, `setIdentityStatus`, `replaceIdentityKey`, scenario and threat documents. | **Submission-ready contract foundation** | HR/identity approval workflow, asset review/reassignment, recovery ceremony, and audit export. |

## Final-project interpretation

The repository provides a **submission-ready final-project engineering foundation**: a canonical Solidity baseline; negative, property, fuzz, static-analysis and CI evidence; a fail-closed API/persistence/indexer/storage reference architecture; a complete source ledger; decision/migration/data controls; and final-project acceptance scenarios. This state is suitable for evaluation and controlled disposable demonstrations under the stated limitations. It must not be represented as a production deployment, real identity platform, complete frontend, completed independent verifier, legal ownership system, completed security audit, or BEL-endorsed implementation.

## Acceptance rule

A requirement may move to an external operational or production readiness claim only when its required evidence is linked from a reviewed protected pull request, reproducible test/build/deployment artifact, operational runbook/drill, and the actual accountable authority's approval. Narrative claims, local fixture injection, or a green workflow alone do not close an external gate.

## References

[1]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
[2]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[3]: https://eips.ethereum.org/EIPS/eip-1155 "ERC-1155 Multi Token Standard"
[4]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[5]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[6]: https://ipfs.tech/ "IPFS documentation and project site"
