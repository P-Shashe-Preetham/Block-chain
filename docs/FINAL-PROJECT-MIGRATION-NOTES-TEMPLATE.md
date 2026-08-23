# Final Project Migration Notes Template

> **Use this template before merging any change to a contract event, ABI decoder, projection schema, API contract, storage envelope/classification policy, database migration, or environment/configuration contract.** A completed note is evidence of review; it does not replace a required external approval, audit, migration rehearsal, or release gate.

## 1. Change identification

| Field | Required entry |
|---|---|
| Migration ID and title | `MIG-YYYY-NNN: <short title>` |
| Author and accountable roles | Named repository contributor plus accountable technical/security/data roles; do not invent organizational approvals. |
| Date and target release | ISO date and release/branch identifier. |
| Change type | Contract / ABI event / indexer / projection / database / API / storage / environment / client / documentation. |
| Linked issue, ADR, and source-ledger rows | Repository links and relevant source IDs. |
| Maturity scope | Local/CI, submission-ready final project, testnet-gated, pilot-gated, or production-gated. |

## 2. Canonical and data impact

| Question | Required answer |
|---|---|
| Does this alter canonical contract state or event meaning? | State `no`, or identify exact functions, mappings, events, ABI version, and ownership/finality consequences. |
| Does this alter projection identity or event version? | State the old/new event key and why any `event_version` change is required under ADR 0007. |
| Does it add, remove, repurpose, or expose a data field? | List exact field names/types and update the data dictionary. |
| Does it process sensitive, identity, plaintext, key, regulated, or biometric data? | State `no`, or stop for the applicable external privacy/legal/KMS approval. |
| Does it affect tenant isolation, retention, deletion, legal hold, residency, or backup/restore? | State `no`, or link the required external decision and operational drill. |

## 3. Compatibility and migration procedure

| Topic | Required evidence |
|---|---|
| Forward migration | Exact ordered command or deployment step; database migrations must be forward-only and transactional where supported. |
| Backfill/replay | Scope, source range, idempotency key, reorg/uncertainty behavior, bounded resource plan, and abort criteria. |
| Compatibility window | Old/new API, ABI, and storage-reader behavior; client/dependency versions; planned removal date or condition. |
| Rollback or forward-fix | Explain why rollback is safe, or provide a forward-only compensating migration. Contract changes need a new deployment/migration strategy; never mutate deployed authority. |
| Failure handling | Expected failure modes, data preservation, alert/operator action, and how authorization remains fail closed. |
| Reconciliation | Canonical-to-projection or source-to-destination comparison to run after completion and its success threshold. |

## 4. Security, privacy, and operational review

| Review area | Required evidence |
|---|---|
| Authorization | Route/worker/client behavior, stale-projection and untrusted-input analysis, and deny-by-default tests. |
| Secrets and keys | Confirmation that no key/secret enters the repository, browser, log, event, projection, or API response. |
| Supply chain | Dependency/license/SBOM/source-ledger impact and pin/update policy. |
| Observability | Sanitized logs, metrics/traces, correlation ID, alert condition, and no sensitive-value emission. |
| Capacity and availability | Measured or bounded load/concurrency characteristics; no production-scale claim without approved evidence. |
| Accessibility and client safety | Keyboard/error/stale/unavailable behavior if a UI/API surface changes. |

## 5. Verification and release-gate evidence

| Verification | Command, fixture, or artifact | Result |
|---|---|---|
| Unit/contract tests | `<command>` | Pending / pass / fail |
| Integration/migration test | `<command>` | Pending / pass / fail |
| Reorg/backfill/idempotency test | `<command>` | Pending / pass / fail / not applicable with rationale |
| API/client compatibility test | `<command>` | Pending / pass / fail / not applicable with rationale |
| Security/static/dependency validation | `<command>` | Pending / pass / fail |
| Data dictionary / reference / Markdown validation | `<command>` | Pending / pass / fail |
| Independent review or external approval | Link to legitimate evidence | Pending unless actual evidence exists |

## 6. Completion record

The accountable roles must state whether the migration is **implemented**, **validated in a disposable environment**, **blocked pending external evidence**, or **rejected**. Add the final evidence links, update the comprehensive improvement register, update affected ADRs/data dictionary/acceptance scenarios, and retain the note with the release evidence. A merged commit without these entries is not evidence of production readiness.
