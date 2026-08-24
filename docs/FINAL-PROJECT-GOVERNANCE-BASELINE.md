# Final Project Governance and Evidence Baseline

## Current maturity statement

The repository is in **active final-project execution**. It contains tested contract, API, persistence, indexer, storage, and web-console reference boundaries, but it is not a production system, controlled testnet deployment, independent audit, organizational pilot, or BEL-endorsed solution. The final project may use only sanitized fixtures until the required external approvals are evidenced.

## Role separation and RACI state

The following roles are responsibilities, not assignments to unnamed individuals. A row marked “external appointment required” is a release blocker; it must not be filled with an invented contact or self-review arrangement.

| Responsibility | Accountable role | Current status | Evidence required |
|---|---|---|---|
| Product scope and final demonstration | Project owner | Owner-controlled decision | Approved scope, personas, non-goals, and demo acceptance record. |
| Contract change and deployment authority | Contract owner plus custody approver | External appointment required | Deployment/custody ADR, multisig or equivalent control, manifest review. |
| Identity assurance and offboarding | Identity/security approver | External appointment required | Provider/DID profile, assurance mapping, privacy basis, test vectors. |
| Storage and key custody | Security/storage approver | External appointment required | KMS/HSM and object-store decision, rotation/recovery drill. |
| Data privacy, legal title, and retention | Authorized privacy/legal stakeholder | External appointment required | Data classification, retention, records and title/access policy. |
| Security incident authority | Security contact and incident lead | Contact not yet approved | Real monitored contact, escalation/rota, incident runbook test. |
| Code review and release approval | Eligible non-author reviewer | Reviewer not available in repository evidence | Protected-PR approval record. |
| Operations and recovery | Operations owner | External appointment required | Backup/restore/reconcile drill, service access review, RTO/RPO decision. |

## Risk register baseline

| Risk ID | Risk | Current control | Closure requirement |
|---|---|---|---|
| R-01 | Unauthorized or fabricated identity assurance | Default API fails closed; identity adapter is gated. | Approved provider/DID profile, security tests, privacy review, offboarding evidence. |
| R-02 | Projection treated as canonical | Repository documentation and design preserve contract authority. | Canonical-read policy, stale/reorg tests, verifier and UI warnings. |
| R-03 | Key/plaintext disclosure | Synthetic-data prohibition, AES-GCM reference, classification and key-release policies. | Approved KMS/HSM, object store, upload controls, recovery and leakage tests. |
| R-04 | Unsafe network/deployer custody | Non-local deployment policy blocks unapproved environments. | Network/finality/custody/multisig decision and reviewed manifest. |
| R-05 | Dependency/license drift | Hash locks, source ledger, notices, automated checks. | Per-adoption provenance, SBOM, secret/license scan, update ownership. |
| R-06 | Incomplete operational recovery | Indexer/persistence references exist; no complete operator service. | Tested backfill/replay/restore/reconcile runbooks and monitored operations. |
| R-07 | Unsupported final-project claim | Documentation distinguishes partial boundaries from release maturity. | Final Release Gate evidence and all mandatory external decisions. |

## Evidence retention rules

Every validation artifact must identify commit hash, command, runtime/image version, synthetic-fixture source, timestamp, result, reviewer where applicable, and linked register/issue ID. Logs must be redacted and must not contain secrets, raw identity data, ciphertext with sensitive context, or private key material.

## Review and release rule

Every change must identify its deployment stage, security/privacy impact, affected authority boundary, tests, documentation update, and remaining limitations. Contract, identity, key custody, deployment, workflow permissions, and release claims require the strongest available non-author review. Where no eligible reviewer exists, the change may remain technically complete but cannot be merged as an approved release.
