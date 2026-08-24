# Final Project Threat Model

## Scope

This threat model covers the submission-ready final-project engineering boundary: `SecureAssetPlatform`, the fail-closed FastAPI/persistence adapters, the read-only indexer/projection reference path, local storage-policy primitives, repository supply chain, and the future Vite/React client boundary. It is an engineering baseline, not a penetration test, independent smart-contract audit, real identity assurance decision, KMS design, or production network review.

## Assets and trust boundaries

| Asset | Security property | Primary concern |
|---|---|---|
| Identity commitment and lifecycle | Integrity, uniqueness, controlled deactivation | Unauthorized registration, commitment reuse, stale identity, key loss |
| Role assignments and canonical authorization | Integrity, least privilege | Admin compromise, escalation, inactive-role retention, projection-derived authorization |
| Token ownership, lifecycle status, and metadata commitment | Integrity, authenticity, traceability | Unauthorized mint/transfer, invalid transition, duplicate allocation, wrong recipient |
| Administrative custody | Confidentiality and availability | Theft/loss, single-key compromise, unapproved recovery |
| Off-chain data boundary | Confidentiality, integrity, availability | Plaintext/key exposure, ciphertext misclassification, unavailable storage, unauthorized release |
| Audit logs and projections | Integrity, completeness, availability | ABI confusion, event gaps, reorganization, projection drift, raw-log disclosure |
| API intents and responses | Integrity, idempotency, data minimization | Unverified caller, conflicting retry, false execution status, response overexposure |
| Repository/CI/dependencies | Integrity and provenance | Malicious dependency/action, secret exposure, unreviewed workflow change |

| Boundary | Required treatment |
|---|---|
| Client to API | Every role label, identity claim, token ID, input field, cache value, and display status is untrusted. No client may decide authorization or confirmation. |
| API to persistence | Settings/session factories may record/read only within their typed boundary. A database cannot become canonical and absent configuration returns unavailable/fails closed. |
| API/indexer to chain | Current API does not sign or submit. Indexer reads/decode/persists only and must validate chain/address/ABI input. Any future signer needs separate custody approval. |
| Events to projection | Event keys are versioned; raw/decoded records are recoverable evidence. Reorg-affected output becomes uncertain and cannot silently remain canonical. |
| Chain to storage | A commitment/CID-like reference is neither confidentiality nor availability. Secrets and plaintext are prohibited from the chain/API/browser. |
| Key-release policy to KMS/HSM | Policy emits non-secret metadata only. A future approved KMS/HSM independently performs any release after IAM/audit controls. |
| CI/dependency supply chain | Pinned workflows/locks, reference ledger, license boundaries, and review requirements constrain changes but do not create a human review. |

## Abuse cases and controls

| ID | Abuse case | Current project-owned control | Evidence still required |
|---|---|---|---|
| TM-01 | Outsider mints or allocates an asset | `MANAGER_ROLE`, active-manager check, negative tests. | Independent review, deployment role/custody policy. |
| TM-02 | Inactive identity receives, transfers, or retains privileged operations | Contract endpoint and role-revocation checks. | Expanded inherited/extension surface review. |
| TM-03 | Owner or ERC-721 operator bypasses controlled transfer | Approval paths disabled; manager and active-identity gates cover transfer paths and `_update`. | Independent contract review and deployment-level approval checks. |
| TM-04 | Default administrator key compromise | Documentation and release gate block real deployment/custody claims. | Multisig, rotation, recovery drill, incident/operator authority. |
| TM-05 | Metadata/input creates gas, indexing, or sensitive-data pressure | Contract uses fixed-size commitments; storage descriptor limits class/size and rejects sensitive/unknown class. | Approved URI/content policy, DLP/malware controls, data-owner decision. |
| TM-06 | Revoked/retired asset is accessed or transferred | Lifecycle transitions and request/transfer gating; contract tests. | Independent lifecycle policy review and real-world asset procedure. |
| TM-07 | Ciphertext, plaintext, or data key is exposed | AES-GCM reference envelope, declared-class rejection, non-secret key-release output, response redaction. | KMS/HSM, object store, key lifecycle, logging/privacy review. |
| TM-08 | Reverted/intent-only operation is presented as committed | Intent API returns `on_chain_submission=false`; transaction status is closed; committed events are separately projected. | Signer/receipt/replacement/reorg workflow and UI evidence. |
| TM-09 | Reorganization or RPC inconsistency makes derived state appear final | Confirmation/status separation, checkpoints, uncertainty/replay/reconciliation references. | Approved finality policy, live provider fault/reorg drill, persistent worker. |
| TM-10 | ABI-confused, malformed, or wrong-contract log reaches projection | Exact event-topic/field decoder rejects unknown/malformed/wrong-address input; one-pass persistence rolls back on decoder failure. | Live approved-RPC and backfill/runbook evidence. |
| TM-11 | API route trusts opaque bearer token or exposes raw audit data | Authentication fails closed without approved verifier; audit response is bounded/redacted; request IDs/headers are constrained. | Approved OIDC/DID/wallet verifier, route-level authorization, distributed abuse controls. |
| TM-12 | Idempotency key conflict produces duplicate or mismatched workflow record | Subject/key uniqueness, canonical request fingerprint, durable adapter tests. | Tenant scope, expiry/retention, multi-instance and outage evidence. |
| TM-13 | CI/dependency source is tampered with | Pinned actions/locks, static/security workflows, source ledger/validator, protected review requirement. | Legitimate non-author review, OpenSSF registration, organizational CODEOWNERS/security contacts. |

## Security invariants

The contract and service evidence must preserve these invariants: a non-active or unregistered identity cannot use role-controlled asset paths; a DID-hash commitment cannot register to two subjects; a non-manager cannot mint/allocate/transfer through controlled paths; each token has one canonical owner; suspended/revoked/retired assets cannot be accessed or transferred; privileged-role removal must not silently leave active capability; pause blocks relevant state changes; projections must not report a confirmed success before the required event/finality policy; API intent recording must never imply submission; and no secret/private key/plaintext sensitive class enters the defined data planes.

## Residual risks and release posture

The project does not solve real-world identity assurance, custody/recovery, legal title, malicious authorized administrators, production-network privacy/finality, external-storage availability, deletion from immutable ledgers, tenant isolation, KMS/HSM control, or production incident response. These risks remain external-gated and must keep corresponding features disabled/fail closed until actual organizational, legal, security, and operational evidence exists.

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[2]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[3]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[4]: https://ipfs.tech/ "IPFS documentation and project site"
