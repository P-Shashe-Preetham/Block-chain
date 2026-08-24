# Local Release-Gate Evidence — 2026-08-23

## Decision

**Result: SOURCE DELIVERY ACCEPTED UNDER A DOCUMENTED EXCEPTION; NOT ELIGIBLE FOR TESTNET, PILOT, OR PRODUCTION.** The full applicable repository-controlled assurance suite passed for the source changes delivered through `152386f`, and documentation-only commits `c4071bb` and `8035f3d` were subsequently validated with reference, Markdown-table, and whitespace checks. The branch was pushed under the user-authorized exception described below because exact-head environment validation and Docker Compose runtime health cannot be completed in this sandbox. This exception does not waive any incomplete local evidence, required remote checks, protected review, or external authority gate.

The latest pushed head is `8035f3d5e5a208f34ad5d76ceb1d70915dff7b8f`. Earlier archived command output remains retained outside the repository; no raw output file is committed and no evidence record contains committed credentials, real identity data, custody material, or production secrets.

## Successful local evidence

| Gate family | Observed command/evidence | Result |
|---|---|---|
| Worktree before controlled delivery | `git status --short --branch` before each controlled commit/push | Clean; no untracked sensitive/generated deployment files were retained. |
| Supply chain | `pnpm audit --audit-level=low` | Pass: no known vulnerabilities. |
| Source controls | `pnpm validate:references` | Pass: 15 original references and 96 ledger records; no submodules or unapproved package integrations. |
| Documentation controls | `pnpm validate:markdown`; `git diff --check` | Pass. |
| Configuration/migrations | `pnpm test:config` with guarded disposable PostgreSQL URL | Pass: 7 tests, 2 PostgreSQL integration skips in the standard discovery path. |
| Contract | `pnpm lint`; `pnpm test`; `pnpm test:coverage`; `pnpm build` | Pass: 17 Solidity tests. Canonical contract line coverage observed at 84.17%; total coverage including uninstrumented Echidna harness was 59.42%. |
| Contract static analysis | Slither 0.11.4 using the workflow-equivalent `--fail-high` threshold | Pass: no high-severity finding. The tool reported timestamp comparisons for access-rule expiry and inherited OpenZeppelin `Pausable` event indexing as non-high review items. |
| Contract property fuzzing | Pinned Echidna 2.3.3 wrapper using Solidity 0.8.24, property mode, 1,000-test limit, and sequence length 20 | Pass: eight current stateful `echidna_*` invariants passed over 1,014 calls; wrapper output SHA-256 `e443f389eb010f98101ef759b0b1b191b35f98edad177644a5074d7a8c1d3dcd`. The container emitted a non-fatal internal Slither warning, so campaign results remain regression evidence rather than a proof of completeness. |
| Services | `pnpm test:services` | Pass: 91 tests, including the then-current service suite. |
| Indexer | `pnpm validate:indexer-abi` | Pass: 17 compiled event fragments. |
| Web console | `pnpm check:web`; `pnpm test:web`; `pnpm test:web:e2e`; `pnpm build:web`; `pnpm check:web:bundle` | Pass: strict check, 3 boundary tests, browser E2E/axe coverage, static build, and project-owned output budget. The measured build output was 416,243 raw JavaScript bytes, 120,458 gzip JavaScript bytes, and 8,223 raw CSS bytes against limits of 460,800, 131,072, and 16,384 bytes respectively. |
| Browser E2E/accessibility | `pnpm test:web:e2e` with local system Chromium | Pass: three critical tests cover keyboard/skip navigation, explicit unavailable state, empty browser storage, rail interaction, axe analysis with no violations, and no horizontal overflow at mobile and desktop viewports. |
| Independent verifier | `pnpm test:verifier`; `pnpm test:verifier:e2e` | Pass: direct-RPC verifier unit tests and a disposable Hardhat JSON-RPC deployment walkthrough that also proves code-hash mismatch rejection. No real-network input was used. |
| Durable persistence regression | Real disposable PostgreSQL integration suite with `PERSISTENCE_POSTGRES_INTEGRATION=1` | Pass: four tests, including same-idempotency-key writer race recovery plus uncertain-event replay and deterministic reconciliation-finding persistence. |
| Operations structure | `sudo docker compose config -q`; local image inspection | Pass: Compose configuration parses; API/migration/web images built and configured entry points were inspected. |
| Synthetic durable-state drill | `scripts/drills/postgres_backup_restore_reconcile.sh` against guarded local PostgreSQL | Pass: restored row counts matched for transaction intents, canonical events, raw logs, checkpoints, and reconciliation findings; temporary database/archive removed. |

## Blocking or incomplete local evidence

| Gate family | Status | Why it blocks the full no-push gate | Required next evidence |
|---|---|---|---|
| Environment validation | Sandbox-limited on the delivered head | The sandbox's restricted environment-file guard prevented a fresh exact-head `pnpm validate:environment` invocation. Remote CI observed the existing validator on the delivered source; that does not replace a future approved-environment validation record. | Run the existing environment validator through an approved non-restricted path against the unchanged environment template. |
| SARIF and remote security publication | Partially closed | Local Slither high-threshold and Echidna campaigns pass, but local SARIF export could not represent two inherited OpenZeppelin findings without locations. Remote CodeQL, Slither, and Echidna checks succeeded on the delivered head; no independent audit or production assurance is implied. | Retain local analyzer outputs; address new actionable findings through the owning remediation workstream. |
| Browser E2E and accessibility | Partially closed | The console now has repository-owned system-Chromium E2E for keyboard navigation, unavailable state, and browser storage plus an axe run with no violations; [the accessibility check](WEB-ACCESSIBILITY-CHECK-2026-08-23.md) records the observed scope. | Complete named screen-reader, zoom/reflow, cross-browser, and future live-workflow accessibility evidence. |
| Compose runtime health | Sandbox-limited | A fresh `docker compose up --build --wait` rebuilt API/migration/web images and PostgreSQL became healthy, but the migration job repeatedly failed to connect to PostgreSQL on the Docker bridge before the bounded attempt was stopped. The sandbox kernel lacks bridge `iptables` support; disabling Docker iptables prevents the required inter-container traffic. | Run `docker compose up --build --wait`, API health/readiness expectations, and teardown in a Docker-capable environment; retain sanitized logs. |
| Verifier walkthrough | External input absent | The direct-RPC verifier implementation is tested, but there is no approved network, deployment address/code hash, token, or finality policy. | Approved deployment/finality inputs and a sanitized direct-RPC walkthrough. |
| Worker/queue/observability | Not enabled by design | No approved worker, queue, monitoring, provider, SLO, or alert-routing selection exists. The repository must not simulate one merely to tick the gate. | Owner-approved selection with ADR, failure/retry/removal tests, operational evidence, and runbooks. |

## External merge and maturity blockers

An approved identity/provider or DID profile, network/finality/deployer custody decision, storage/KMS owner decision, privacy/legal/records approval, independent assurance, organizational CODEOWNERS/team policy, OpenSSF registration, real monitored support contacts, and an eligible non-author reviewer remain external blockers. The PR’s automated checks are successful on the delivered head, but a required legitimate non-author review decision is absent and no testnet, pilot, or production authority exists.

## Required next action

Do not merge, self-approve, simulate review, deploy to any network, create external resources, or claim production readiness. Complete the accountable decision packets, select hosting/identity/chain/custody/KMS/storage/legal/operations arrangements, execute the synthetic-only staging runbook on an approved Docker-capable environment, then proceed only through the authorized maturity gate with legitimate non-author review.

## Delivery exception — user-authorized source push

On 2026-08-24, the user explicitly authorized the agent to proceed using its safest available judgment after being informed that exact-head environment validation and Compose runtime health remained unavailable in this sandbox. This permits **one controlled source push** of the clean feature branch for remote protected checks. It does not convert either incomplete local condition into a pass, waive the required remote checks or non-author review, authorize a merge or branch-protection bypass, or change the submission-ready/non-production maturity boundary.

The pushed branch must retain this exception, the bounded local runbook, and all unresolved identity, network, custody, storage/KMS, legal/privacy, organizational, verifier, and independent-assurance gates. Any subsequent failure returns the work to the owning remediation phase.

## Controlled delivery outcome

The clean branch was pushed normally to `origin/feat/api-fail-closed-auth-baseline` at `8035f3d5e5a208f34ad5d76ceb1d70915dff7b8f`, without force-push, merge, or protection bypass. Pull request [#13](https://github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management/pull/13) is open against `fix/repository-truth-and-config`.

Remote monitoring observed all nine currently reported checks successful on the pushed head: the primary CI lint/test/build workflow, CodeQL and JavaScript/TypeScript analysis, Slither and Solidity analysis, Echidna invariants, OpenSSF Scorecard and Scorecard analysis, and CodeRabbit (review skipped by its configured policy). This verifies the remote workflows for the delivered source commit; it does not satisfy the still-required legitimate non-author review, complete external approvals, or any controlled-testnet/pilot/production maturity condition.
