# Final Project Execution and Delivery Plan

## Purpose

This document operationalizes the current approved final-project roadmap for the Blockchain Secure Platform. It supplements, rather than erases, the earlier [Final Project Completion Plan](FINAL-PROJECT-COMPLETION-PLAN.md). Its purpose is to turn the repository into a submission-ready, end-to-end **final project** using sanitized evidence while preserving explicit boundaries around production, external approval, and organizational authority.

> “Perfect” means objectively verifiable against a predefined release gate. It does not justify an unsupported claim of production readiness, independent audit, BEL endorsement, legal title, or approval.

## Final-project outcomes

| Outcome | Evidence boundary |
|---|---|
| Canonical EVM asset and access workflow | The approved `SecureAssetPlatform` ABI, deployed-code hash, tests, static analysis, fuzz outputs, and verifier procedure support the demonstrated behavior. |
| Verified identity adapter | A real approved identity provider or DID/VC profile supplies assurance. Until it exists, the API remains fail-closed. |
| Durable read model | PostgreSQL projections, raw logs, checkpoints, reorg uncertainty, reconciliation, and replay are rebuildable and never override chain facts. |
| Encrypted payload reference workflow | Only declared permitted synthetic payloads pass classification; envelope encryption and key-release policy never expose keys or plaintext through the client. |
| Transaction-safe API | Versioned routes use server-side authorization, idempotency, canonical freshness, redaction, bounded errors, and confirmation-aware state. |
| Accessible web and independent verifier | The web console makes evidence and limitations visible; a verifier reproduces evidence from chain/ABI/input instead of browser or database state. |
| Reproducible delivery | CI, local integration, security scans, SBOM/provenance, runbooks, evidence index, and release gate results are retained. |

## Architecture commitments

The canonical contract owns identity-reference lifecycle, roles, asset ownership, asset lifecycle, access decisions, and pause state. The FastAPI service, PostgreSQL, cache, queue, object store, browser, analytics, and any AI component are non-authoritative and must fail closed when canonical evidence is unavailable or stale.

| Concern | Selected direction | Explicit non-adoption or gate |
|---|---|---|
| Contract | Solidity, Hardhat, OpenZeppelin | No alternate chain or upgrade pattern without a reviewed ADR and migration evidence. |
| Backend | FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL | Prisma and a TypeScript backend remain comparison inputs only; a second ORM is prohibited without an ADR. |
| Identity | Approved OIDC/PKI or DID/VC adapter, optionally supplemented by wallet proof | Wallet possession is not organizational identity; no JWT decoding or provider simulation is accepted. |
| Worker and queue | A bounded non-authoritative worker and one selected queue implementation | Redis/BullMQ, NATS/Kafka, Airflow, and n8n require separate requirement, license, failure, and removal decisions. |
| Storage | KMS/HSM-backed envelope encryption with an approved object store | MinIO is disposable local-test infrastructure only until its distribution/hosting terms are explicitly reviewed. |
| Web | React/TypeScript, project-owned accessible components, i18n, query/form validation, E2E, verifier | The browser is not an authorization, signing, or custody authority. |
| Delivery | Compose for local integration; reviewed OpenTofu-oriented IaC comparison | No testnet or production host is selected until network, custody, residency, recovery, and cost decisions exist. |

## Execution sequence

| Phase | Primary deliverables | Exit evidence |
|---|---|---|
| 0. Governance and source activation | Charter, RACI state, risk register, source-adoption protocol, release gate, approved defaults | Every register item and source is traceable; missing external owners are explicitly blocked. |
| 1. Requirements and design | Data dictionary, role matrix, diagrams, threat model, UX acceptance scenarios | Architecture, acceptance criteria, traceability, and tests use the same vocabulary. |
| 2. Identity and deployment decisions | Provider/DID, network/finality, custody, storage, tenant, and recovery ADRs | Actual decision owner, approval, protocol profile, and synthetic test vectors exist. |
| 3. Contract assurance | Approved ABI/event version, positive/negative/property/fuzz/static/gas evidence, verifier guide | Contract surface and known limitations are evidence-backed. |
| 4. Durable substrate | PostgreSQL migration/concurrency/restore evidence; indexer worker, replay, reorg, reconciliation, metrics/runbooks | A clean database and bounded chain range rebuild equivalent derived evidence. |
| 5. Storage custody | Object-store/KMS integration, upload/download controls, integrity/denial/recovery drills | No key or plaintext leak occurs in synthetic failure drills. |
| 6. API coordination | Authenticated, authorized, tenant-scoped, idempotent, confirmation-aware API and OpenAPI | No route declares a canonical success before expected chain evidence is confirmed. |
| 7. Web and verifier | Role-aware accessible console, i18n, E2E, stale/failure/recovery UI, independent verifier | Browser tests and accessibility/manual evidence pass without secrets in browser state. |
| 8–10. Optional capability and operations gates | Only approved search, realtime, queue, AI, analytics, desktop/mobile, IaC, Compose, observability, DR | Each optional capability has an ADR, benchmark, threat model, failure test, and removal path. |
| 11. Assurance and release candidate | Full sanitized integration, load/chaos/security/DR evidence, demo script, release evidence package | The no-push gate is green and outstanding approvals determine the honest maturity label. |

## Source utilization rule

All source repositories are recorded in [the reference ledger](reference-ledger.md). A source has been meaningfully used only when its row links to an extracted decision, implementation pattern, test scenario, training item, operational control, or explicit non-adoption decision. It must never be copied, vendored, made a submodule, installed, or hosted merely to claim use.

The project uses the supplied development defaults through [Project Engineering Defaults](PROJECT-ENGINEERING-DEFAULTS.md). These defaults describe selection and comparison policy; they are not permission to introduce incompatible runtime stacks or restrictive-license services.

## Controlled GitHub delivery rule

No further source change is pushed while it has only partial local validation. The exact staged commit must satisfy the [Final Release Gate](FINAL-RELEASE-GATE.md) before a controlled push. Because hosted CI is necessarily evaluated after a push, the delivery sequence is: run all local gates; archive output hashes; create one conventional commit; re-run the release gate; push only that clean commit; wait for remote checks; request legitimate non-author review; merge only through protected policy.

Any local or remote failure returns the work to its owning phase. Normal progress may not use an administrative bypass, self-approval, invented reviewer, or fabricated external evidence.

## Current external blockers

The following are not code tasks and may not be marked complete without direct evidence: an approved identity provider or DID profile; network/finality/deployer-custody decision; KMS/HSM and storage owner decision; real monitored security and support contacts; privacy/legal/records approval; independent contract/application review; OpenSSF registration; organizational CODEOWNERS/team structure; and an eligible non-author reviewer.
