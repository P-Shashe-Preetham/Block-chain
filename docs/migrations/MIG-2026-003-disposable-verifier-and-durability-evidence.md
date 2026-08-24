# MIG-2026-003: Disposable Verifier and Durability Evidence

## 1. Change identification

| Field | Record |
|---|---|
| Migration ID and title | `MIG-2026-003: Disposable verifier and durability evidence` |
| Author and accountable roles | Manus AI as repository contributor; repository technical/security/data roles remain unassigned external governance roles. |
| Date and target release | 2026-08-24; `feat/api-fail-closed-auth-baseline` submission-ready source branch. |
| Change type | Indexer/persistence test coverage, verifier test coverage, client build control, CI, and documentation. |
| Linked issue, ADR, and source-ledger rows | ADR 0007, ADR 0008, accepted DEC-05, reference-ledger row 91 (Ponytail process reference). |
| Maturity scope | Local/CI and submission-ready final project only. |

## 2. Canonical and data impact

| Question | Record |
|---|---|
| Does this alter canonical contract state or event meaning? | No. The E2E fixture deploys the existing canonical contract to a disposable Hardhat node only. |
| Does this alter projection identity or event version? | No. The PostgreSQL test exercises existing event identities/statuses and replay helpers. |
| Does it add, remove, repurpose, or expose a data field? | No. Test data is synthetic and the bundle-budget script inspects only generated public asset sizes. |
| Does it process sensitive, identity, plaintext, key, regulated, or biometric data? | No. The local Hardhat private key is the documented public disposable test account; it is not a production secret. No real identity or asset data is used. |
| Does it affect tenant isolation, retention, deletion, legal hold, residency, or backup/restore? | No. The change adds synthetic concurrency/replay evidence only. |

## 3. Compatibility and migration procedure

| Topic | Record |
|---|---|
| Forward migration | Run `pnpm test:verifier:e2e`; run the PostgreSQL integration suite with its existing disposable CI/local environment; after `pnpm build:web`, run `pnpm check:web:bundle`. No schema or deployment migration occurs. |
| Backfill/replay | No data backfill. The regression fixture marks a synthetic unfinalized event uncertain and restores it through the existing replay path. |
| Compatibility window | The verifier CLI arguments/API contract are unchanged. The web console keeps its existing fail-closed audit behavior; CI adds required validation steps. |
| Rollback or forward-fix | Remove the new test/budget gate if it proves invalid, then replace it with a corrected project-owned test. Do not weaken existing verifier/persistence/browser security behavior. |
| Failure handling | Verifier expectation mismatch exits nonzero; PostgreSQL conflict recovery returns an existing matching intent or rejects a conflicting fingerprint; bundle growth over budget fails CI. No test authorizes chain state, production deployment, or browser secrets. |
| Reconciliation | The PostgreSQL fixture proves uncertain-event replay returns the existing canonical identity to `canonical` and persists one deterministic reconciliation finding. |

## 4. Security, privacy, and operational review

| Review area | Record |
|---|---|
| Authorization | Direct-RPC verifier remains read-only and independent of browser/API/projection state. Persistence remains non-authoritative. |
| Secrets and keys | No real secret, key, credential, payload, or log is added. Disposable local Hardhat credentials never leave test scope. |
| Supply chain | No new dependency is introduced. The earlier Ponytail-guided simplification removed an unused browser query dependency; this note adds only Node/Hardhat capabilities already locked in the project. |
| Observability | Test commands emit only synthetic IDs and aggregate bundle measurements. Production monitoring is not claimed. |
| Capacity and availability | The test is bounded to one disposable local node and two PostgreSQL writer sessions. It is not a production load or HA claim. |
| Accessibility and client safety | The bundle gate follows existing web type/unit/E2E/axe controls and does not change the UI authority boundary. |

## 5. Verification and release-gate evidence

| Verification | Command, fixture, or artifact | Result |
|---|---|---|
| Unit/contract tests | `pnpm test` | Pending final combined gate after this note. |
| Integration/migration test | `PERSISTENCE_POSTGRES_INTEGRATION=1 ... python -m unittest scripts.tests.test_persistence_postgres -v` | Pass: migration round-trip, unique conflict, two-writer idempotency race, replay, and finding persistence. |
| Reorg/backfill/idempotency test | `scripts/tests/test_persistence_postgres.py` | Pass in disposable PostgreSQL. |
| API/client compatibility test | `pnpm test:verifier:e2e`; `pnpm build:web && pnpm check:web:bundle` | Pass: direct local RPC success plus code-hash mismatch denial; current assets pass their project-owned budget. |
| Security/static/dependency validation | `pnpm audit --audit-level=low` | Pending final combined gate after this note. |
| Data dictionary / reference / Markdown validation | `pnpm validate:references && pnpm validate:markdown && git diff --check` | Pending final combined gate after this note. |
| Independent review or external approval | Legitimate non-author review and deployment approvals | Pending; no approval is implied. |

## 6. Completion record

This change is **implemented and validated in disposable local environments** for its current individual test evidence. It is blocked from testnet, pilot, and production use pending approved identity, network/finality/custody, KMS/storage, privacy/legal, tenant/operations, independent assurance, and legitimate non-author review evidence.
