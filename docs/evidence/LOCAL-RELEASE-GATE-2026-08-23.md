# Local Release-Gate Evidence — 2026-08-23

## Decision

**Result: NOT ELIGIBLE FOR PUSH.** The available local checks passed for revision `cbdb6af96bf5bd063ca4e58cf268dabbf56f90b7`, but the full gate in [FINAL-RELEASE-GATE.md](../FINAL-RELEASE-GATE.md) is not green. This record preserves the user's no-push rule: no source change after `5065c86` has been pushed, and the branch must remain local-only until every selected local gate is objectively satisfied.

The archived combined command output has SHA-256 `3bf16c6221785b9dd80ce9b6bd3d15212c956628fc5f46439c57c4a5178b56f7` in the sandbox evidence location. It contains no committed credentials or real identity data.

## Successful local evidence

| Gate family | Observed command/evidence | Result |
|---|---|---|
| Worktree before evidence record | `git status --short --branch` at `cbdb6af` | Clean; local branch was ahead of origin by seven commits and was not pushed. |
| Supply chain | `pnpm audit --audit-level=low` | Pass: no known vulnerabilities. |
| Source controls | `pnpm validate:references` | Pass: 15 original references and 96 ledger records; no submodules or unapproved package integrations. |
| Documentation controls | `pnpm validate:markdown`; `git diff --check` | Pass. |
| Configuration/migrations | `pnpm test:config` with guarded disposable PostgreSQL URL | Pass: 7 tests, 2 PostgreSQL integration skips in the standard discovery path. |
| Contract | `pnpm lint`; `pnpm test`; `pnpm test:coverage`; `pnpm build` | Pass: 17 Solidity tests. Canonical contract line coverage observed at 84.17%; total coverage including uninstrumented Echidna harness was 59.42%. |
| Contract static analysis | Slither 0.11.4 using the workflow-equivalent `--fail-high` threshold | Pass: no high-severity finding. The tool reported timestamp comparisons for access-rule expiry and inherited OpenZeppelin `Pausable` event indexing as non-high review items. |
| Services | `pnpm test:services` | Pass: 91 tests. |
| Indexer | `pnpm validate:indexer-abi` | Pass: 17 compiled event fragments. |
| Web console | `pnpm check:web`; `pnpm test:web`; `pnpm build:web` | Pass: strict check, 3 boundary tests, static build. |
| Independent verifier | `pnpm test:verifier` | Pass: 3 direct-RPC verifier unit tests. |
| Operations structure | `sudo docker compose config -q`; local image inspection | Pass: Compose configuration parses; API/migration/web images built and configured entry points were inspected. |
| Synthetic durable-state drill | `scripts/drills/postgres_backup_restore_reconcile.sh` against guarded local PostgreSQL | Pass: restored row counts matched for transaction intents, canonical events, raw logs, checkpoints, and reconciliation findings; temporary database/archive removed. |

## Blocking or incomplete local evidence

| Gate family | Status | Why it blocks the full no-push gate | Required next evidence |
|---|---|---|---|
| Environment validation | Not rerun on this revision | The sandbox's restricted environment-file guard prevented a fresh `pnpm validate:environment` invocation. Prior evidence is not a replacement for exact-head evidence. | Run the existing environment validator through an approved non-restricted path against the unchanged environment template. |
| Static/security analyzers | Incomplete | Slither high-threshold analysis now passes locally, but local SARIF export could not represent two inherited OpenZeppelin findings without locations; Echidna and Semgrep remain unavailable. Previous remote evidence does not cover the unpushed commits. | Run the pinned Echidna campaign and a reproducible SARIF/static-analysis path, then retain current-head evidence; never claim remote results before a controlled push. |
| Browser E2E and accessibility | Partially closed | The console now has repository-owned system-Chromium E2E for keyboard navigation, unavailable state, and browser storage plus an axe run with no violations; [the accessibility check](WEB-ACCESSIBILITY-CHECK-2026-08-23.md) records the observed scope. | Complete named screen-reader, zoom/reflow, cross-browser, and future live-workflow accessibility evidence. |
| Compose runtime health | Sandbox-limited | Docker Compose structure and images passed, but the sandbox kernel lacks bridge `iptables` support. With Docker's iptables disabled, inter-container PostgreSQL traffic cannot complete. | Run `docker compose up --build --wait`, API health/readiness expectations, and teardown in a Docker-capable environment; retain sanitized logs. |
| Verifier walkthrough | External input absent | The direct-RPC verifier implementation is tested, but there is no approved network, deployment address/code hash, token, or finality policy. | Approved deployment/finality inputs and a sanitized direct-RPC walkthrough. |
| Worker/queue/observability | Not enabled by design | No approved worker, queue, or monitoring selection exists. The repository must not simulate one merely to tick the gate. | Owner-approved selection with ADR, failure/retry/removal tests, operational evidence, and runbooks. |

## External merge and maturity blockers

An approved identity/provider or DID profile, network/finality/deployer custody decision, storage/KMS owner decision, privacy/legal/records approval, independent assurance, organizational CODEOWNERS/team policy, OpenSSF registration, real monitored support contacts, and an eligible non-author reviewer remain external blockers. Remote CI, CodeQL, Slither, Echidna, scorecard/dependency checks, and protected-PR review cannot be claimed for the unpushed local commits.

## Required next action

Do **not** push. Complete the blocking local evidence above, update this record with only observed results, create the final conventional release commit, rerun repository-integrity checks on that exact head, and only then make one controlled push for remote protected checks and legitimate non-author review.
