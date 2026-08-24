# Final Project Release Gate

## Gate principle

The final project is only eligible for a controlled delivery commit when the exact staged source tree passes every applicable local gate below. Remote CI and protected pull-request checks run after that controlled push and are additional merge requirements. A check that is not applicable because its subsystem has not been approved must be documented as **not enabled by design**, not silently skipped.

## Local pre-push gate

| Gate family | Mandatory evidence |
|---|---|
| Repository integrity | Clean worktree, conventional commit, `git diff --check`, reference/Markdown/environment/config/schema validation, no generated deployment evidence, no untracked sensitive material. |
| Supply chain | Frozen/hash-locked dependencies, third-party notices, SBOM/provenance, secret scan, license review, pinned actions/images, reproducible artifact hashes. |
| Contract | Build, full unit/negative/event tests, coverage policy, properties/fuzz corpus, gas guard, Slither, ABI drift guard, artifact/deployment manifest checks. |
| Python services | Lint/type checks, complete service tests, configuration failure tests, migrations, real disposable PostgreSQL integration, indexer replay/reorg/reconciliation, storage/key tests. |
| Web and verifier | Type-check, production build, unit/component tests, critical E2E, accessibility automation and manual checklist, browser secret-storage inspection, verifier independence test. |
| Operations | Compose health checks, queue/worker retries, backup/restore/reconcile drill, redacted metrics/log checks, synthetic load and chaos result when selected infrastructure exists. |
| Documentation | ADRs, diagrams, data dictionary, threat model, API docs, runbooks, release notes, demo script, reference ledger, risk register, known limitations, and maturity label synchronized. |

## Remote merge gate

The branch is not mergeable until required remote CI, CodeQL, Slither, Echidna, scorecard/supply-chain checks, dependency review, and any future web/integration checks succeed on the same commit. A legitimate eligible non-author reviewer must approve in accordance with branch protection. Administrative bypass, self-approval, reviewer simulation, and suppressed failing evidence are prohibited.

## Maturity labels

| Label | Minimum claim allowed |
|---|---|
| Submission-ready final project | Sanitized end-to-end workflow and all selected local/remote release evidence; unresolved external decisions visibly disable their features. |
| Controlled testnet | Submission-ready evidence plus approved network/finality, deployer custody, source/ABI verification, monitoring, pause/incident readiness, and testnet smoke evidence. |
| Pilot | Controlled testnet evidence plus approved real identity/storage/privacy/operations arrangements and risk acceptance. |
| Production | Pilot evidence plus independent assurance, KMS/HSM custody, legal/privacy/records approval, HA/DR, real monitoring/support contacts, and signed go/no-go authority. |

## Push procedure

1. Run the complete local release gate on the exact staged tree and archive redacted outputs with hashes.
2. Create a single conventional commit only after every selected local check is green.
3. Re-run repository integrity and release documentation checks after the commit.
4. Push the clean branch once, monitor remote checks, request legitimate review, and never merge by ordinary bypass.
5. If a check fails, record the failure in the improvement register, repair it in the owning workstream, and restart the gate.
