# Production Decision Packets

## Purpose

These packets convert each externally blocked deployment prerequisite into an actionable approval record. They do not select a provider, grant authority, or authorize a testnet, pilot, or production release. An accountable human role must complete each packet with real evidence before the corresponding capability is enabled.

> NIST SP 800-63 Revision 4 describes process and technical requirements for digital identity assurance across identity proofing, authentication, and federation, including security and privacy considerations.[1] NIST SP 800-57 provides general cryptographic key-management guidance, including protection requirements and key-management functions.[2]

## Completion rule

Every packet requires a named accountable role, a decision date, approved evidence location, threat-model/ADR delta, test plan, rollback or removal plan, and a signed go/no-go outcome. “Unknown,” “to be decided,” an unverified vendor claim, or an agent-generated statement is not approval.

## Packet A — Identity and organizational trust

| Required decision | Evidence the accountable identity/privacy/security roles must provide | Repository work enabled only after approval |
|---|---|---|
| Identity model | OIDC/PKI provider or DID/VC method; issuer/trust registry; assertion schema; audience and tenancy model. | Implement the existing fail-closed verifier adapter, not a header/JWT shortcut. |
| Assurance model | Risk-based assurance mapping, identity proofing/enrollment requirements, authenticator requirements, federation rules, fraud controls, and user experience constraints. | Claim-to-principal mapping, issuer/JWKS rotation, signature/audience/nonce/expiry validation, and deterministic negative tests. |
| Lifecycle | Enrollment, activation, revocation, recovery, key rotation, offboarding, dispute handling, and support ownership. | Revocation/recovery/offboarding workflows and provider-outage fail-closed tests. |
| Privacy | Legal basis, data minimization, residency, retention, access/export/deletion constraints, notices, and data-protection contact. | Field-level policies, redaction, logs/export controls, and retention jobs only after approval. |

**Approval output:** an identity-profile ADR, test vectors supplied by the issuer/provider, security review, privacy approval, support escalation, and a staged synthetic-identity integration report.

## Packet B — Blockchain network, finality, and custody

| Required decision | Evidence the accountable chain/custody/security roles must provide | Repository work enabled only after approval |
|---|---|---|
| Network | Selected EVM network, chain ID, jurisdiction/residency constraints, RPC providers, provider-diversity policy, rate/cost limits, and service agreement evidence. | Environment schema values, RPC allowlist, provider health checks, and testnet configuration. |
| Finality/reorg policy | Confirmation threshold, acceptable reorg depth, uncertainty exposure rules, checkpoint retention, reconciliation thresholds, and stop/alert conditions. | Network-specific indexer configuration, reorg simulation, alerting, and operator runbook. |
| Deployment custody | Deployer/multisig membership, quorum, signer hardware/custody, separation of duties, transaction review, break-glass/pause authority, and key-loss recovery. | Controlled deployment procedure, immutable manifest, source/ABI/code-hash verification, and incident exercise. |
| Asset/legal scope | Token-to-asset binding policy, physical tag strategy, title/ownership disclaimers, issuance/transfer authority, and dispute process. | Approved physical-binding/verifier flow and explicit legal-title UI/API wording. |

**Approval output:** a network/custody ADR, controlled testnet deployment authorization, deployment checklist, multisig evidence, and a sanitized independent-verifier walkthrough.

## Packet C — Storage, KMS/HSM, and data lifecycle

| Required decision | Evidence the accountable security/data/privacy roles must provide | Repository work enabled only after approval |
|---|---|---|
| Key custody | KMS/HSM choice, root-of-trust, key hierarchy, access policy, rotation, escrow/recovery, break-glass, and compromise response. | KMS-backed envelope-key adapter, least-privilege policy, audit trail, rotation/failure/recovery tests. |
| Storage | Object-store or content-addressed provider, encryption boundary, tenancy, geographic residency, durability, versioning, immutable-retention and deletion behavior. | Production storage adapter, synthetic-object integration, integrity checks, and regional policy tests. |
| Content safety | Data classification, malware/content scanning, allowable formats/size limits, plaintext prohibition, quarantine and operator workflow. | Upload/classification pipeline and negative/pathological content tests. |
| Records lifecycle | Retention, legal hold, deletion/erasure, export, backup, restore, reconciliation, and evidence ownership. | Lifecycle jobs/runbooks, restore drills, reconciler thresholds, and compliance evidence. |

**Approval output:** security architecture review, privacy/records approval, KMS/storage threat-model delta, synthetic failure drill, and recovery evidence. No encryption helper alone constitutes KMS/HSM approval.

## Packet D — Tenant, database, operations, and hosting

| Required decision | Evidence the accountable platform/data/operations roles must provide | Repository work enabled only after approval |
|---|---|---|
| Hosting topology | Selected provider/accounts/regions, network segmentation, ingress/WAF/TLS, container registry, infrastructure-as-code state security, capacity/cost budget. | Immutable staging/production deployment definitions and approved deployment pipeline. |
| Tenant isolation | Tenant identifier ownership, row/schema/database strategy, authorization enforcement point, admin/support boundaries, cross-tenant test requirements. | Schema/migration changes, route/indexer scoping, isolation tests, and data-access review. |
| Database resilience | Production roles, TLS, encryption, HA/replication, RPO/RTO, backup location/retention, restore ownership, and capacity target. | Managed database configuration, encrypted backup/restore/reconcile drills, and load/failover evidence. |
| Observability and support | SLOs/error budgets, logs/metrics/traces/redaction, alerts, on-call rota, incident severity/escalation, customer support, vulnerability reporting. | Metrics/alert instrumentation, synthetic probes, tabletop exercise, and documented support handoff. |

**Approval output:** reviewed infrastructure design, staging environment authorization, SLO/RPO/RTO record, incident/rollback plan, capacity plan, and operations/security approval.

## Packet E — Legal, independent assurance, and release authority

| Required decision | Evidence the accountable legal/security/release roles must provide | Repository work enabled only after approval |
|---|---|---|
| Legal/privacy/records | Privacy impact assessment, data-processing/legal basis, asset/title terms, notices, records obligations, jurisdiction and vendor review. | Real-data or real-asset activation only after the approved policy is implemented and tested. |
| Independent assurance | Scope, assessor independence, contract/application/cloud/API/mobile/storage coverage, remediation process, and residual-risk acceptance owner. | Testnet/pilot/production release candidate evaluation. |
| Release authority | Protected branch/review policy, change-management rules, environment approval membership, release manager, emergency authority, rollback conditions. | Production release workflow and immutable provenance publication. |
| Support and disclosure | Security contact, private disclosure channel, public vulnerability policy, incident communications and regulatory notification path. | Production support and security-response operation. |

**Approval output:** legitimate non-author PR review, independent assessment report or signed acceptance, legal/privacy approval, operations/security release approval, and formal production go/no-go record.

## Execution order and state transitions

| Maturity state | Mandatory completed packets | Permitted activity |
|---|---|---|
| Submission-ready final project | None beyond the existing fail-closed boundaries | Source review, synthetic local/CI tests, static console demonstration. |
| Controlled testnet | A, B, D (synthetic-data subset) | Approved testnet deployment and synthetic end-to-end workflow. |
| Pilot | A–E, scoped to the pilot | Approved constrained users/data/assets under monitoring and rollback control. |
| Production/mass deployment | A–E in full, independent assurance, HA/DR/operations evidence | Gradual production rollout after signed go/no-go authority. |

## References

[1] [NIST SP 800-63-4, Digital Identity Guidelines](https://pages.nist.gov/800-63-4/)

[2] [NIST SP 800-57 Part 1 Rev. 5, Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
