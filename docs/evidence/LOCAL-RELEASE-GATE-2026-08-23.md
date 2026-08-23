# Local Release-Gate Evidence — 2026-08-23

## Decision

**Result: NOT ELIGIBLE FOR PUSH.** The available full local assurance suite passed for revision `9dfbce9cab082a064ca2f606608c096a94f82e42`, but the full gate in [FINAL-RELEASE-GATE.md](../FINAL-RELEASE-GATE.md) is not green. This record preserves the user's no-push rule: no source change after `5065c86` has been pushed, and the branch must remain local-only until every selected local gate is objectively satisfied.

The latest archived combined command output has SHA-256 `9d3733f809765c99eb929a2592f2337ae48b6ece9424a90ff11c435627f84911` in the sandbox evidence location. Earlier staged evidence remains separately hashed; no output file is committed and neither contains committed credentials or real identity data.

## Successful local evidence

| Gate family | Observed command/evidence | Result |
|---|---|---|
| Worktree before current assurance run | `git status --short --branch` at `9dfbce9` | Clean; local branch was ahead of origin by eleven commits and was not pushed. |
| Supply chain | `pnpm audit --audit-level=low` | Pass: no known vulnerabilities. |
| Source controls | `pnpm validate:references` | Pass: 15 original references and 96 ledger records; no submodules or unapproved package integrations. |
| Documentation controls | `pnpm validate:markdown`; `git diff --check` | Pass. |
| Configuration/migrations | `pnpm test:config` with guarded disposable PostgreSQL URL | Pass: 7 tests, 2 PostgreSQL integration skips in the standard discovery path. |
| Contract | `pnpm lint`; `pnpm test`; `pnpm test:coverage`; `pnpm build` | Pass: 17 Solidity tests. Canonical contract line coverage observed at 84.17%; total coverage including uninstrumented Echidna harness was 59.42%. |
| Contract static analysis | Slither 0.11.4 using the workflow-equivalent `--fail-high` threshold | Pass: no high-severity finding. The tool reported timestamp comparisons for access-rule expiry and inherited OpenZeppelin `Pausable` event indexing as non-high review items. |
| Contract property fuzzing | Pinned Echidna 2.3.3 wrapper using Solidity 0.8.24, property mode, 1,000-test limit, and sequence length 20 | Pass: eight current stateful `echidna_*` invariants passed over 1,014 calls; wrapper output SHA-256 `e443f389eb010f98101ef759b0b1b191b35f98edad177644a5074d7a8c1d3dcd`. The container emitted a non-fatal internal Slither warning, so campaign results remain regression evidence rather than a proof of completeness. |
| Services | `pnpm test:services` | Pass: 91 tests. |
| Indexer | `pnpm validate:indexer-abi` | Pass: 17 compiled event fragments. |
| Web console | `pnpm check:web`; `pnpm test:web`; `pnpm build:web` | Pass: strict check, 3 boundary tests, static build. |
| Browser E2E/accessibility | `pnpm test:web:e2e` with local system Chromium | Pass: two critical tests cover keyboard/skip navigation, explicit unavailable state, empty browser storage, rail interaction, and axe analysis with no violations. |
| Independent verifier | `pnpm test:verifier` | Pass: 3 direct-RPC verifier unit tests. |
| Operations structure | `sudo docker compose config -q`; local image inspection | Pass: Compose configuration parses; API/migration/web images built and configured entry points were inspected. |
| Synthetic durable-state drill | `scripts/drills/postgres_backup_restore_reconcile.sh` against guarded local PostgreSQL | Pass: restored row counts matched for transaction intents, canonical events, raw logs, checkpoints, and reconciliation findings; temporary database/archive removed. |

## Blocking or incomplete local evidence

| Gate family | Status | Why it blocks the full no-push gate | Required next evidence |
|---|---|---|---|
| Environment validation | Not rerun on this revision | The sandbox's restricted environment-file guard prevented a fresh `pnpm validate:environment` invocation. Prior evidence is not a replacement for exact-head evidence. | Run the existing environment validator through an approved non-restricted path against the unchanged environment template. |
| SARIF and remote security publication | Incomplete | Local Slither high-threshold and Echidna campaigns pass, but local SARIF export could not represent two inherited OpenZeppelin findings without locations. Remote CodeQL/SARIF publication cannot be claimed until a controlled push. | Retain local analyzer outputs; wait for protected remote CodeQL/Slither/Echidna results only after the complete local gate is green. |
| Browser E2E and accessibility | Partially closed | The console now has repository-owned system-Chromium E2E for keyboard navigation, unavailable state, and browser storage plus an axe run with no violations; [the accessibility check](WEB-ACCESSIBILITY-CHECK-2026-08-23.md) records the observed scope. | Complete named screen-reader, zoom/reflow, cross-browser, and future live-workflow accessibility evidence. |
| Compose runtime health | Sandbox-limited | Docker Compose structure and images passed, but the sandbox kernel lacks bridge `iptables` support. With Docker's iptables disabled, inter-container PostgreSQL traffic cannot complete. | Run `docker compose up --build --wait`, API health/readiness expectations, and teardown in a Docker-capable environment; retain sanitized logs. |
| Verifier walkthrough | External input absent | The direct-RPC verifier implementation is tested, but there is no approved network, deployment address/code hash, token, or finality policy. | Approved deployment/finality inputs and a sanitized direct-RPC walkthrough. |
| Worker/queue/observability | Not enabled by design | No approved worker, queue, or monitoring selection exists. The repository must not simulate one merely to tick the gate. | Owner-approved selection with ADR, failure/retry/removal tests, operational evidence, and runbooks. |

## External merge and maturity blockers

An approved identity/provider or DID profile, network/finality/deployer custody decision, storage/KMS owner decision, privacy/legal/records approval, independent assurance, organizational CODEOWNERS/team policy, OpenSSF registration, real monitored support contacts, and an eligible non-author reviewer remain external blockers. Remote CI, CodeQL, Slither, Echidna, scorecard/dependency checks, and protected-PR review cannot be claimed for the unpushed local commits.

## Required next action

Do **not** push. Complete the blocking local evidence above, update this record with only observed results, create the final conventional release commit, rerun repository-integrity checks on that exact head, and only then make one controlled push for remote protected checks and legitimate non-author review.
