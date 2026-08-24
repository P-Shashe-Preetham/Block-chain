# MVP to Final Project: Exhaustive Reference-Utilization and Delivery Plan

## 1. Purpose and interpretation of “use every single thing to the fullest”

This plan moves `tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management` from its current Solidity/Hardhat MVP and partially implemented service foundations to an **evaluation-ready, end-to-end final project** for SIH 2026 Problem Statement 26125. It incorporates every reference supplied in the original 15-repository list, the full-stack development lists, the situational tooling lists, the beyond-web lists, the adjacent data/ML list, and the agent/design lists in the three attachments.

“Use every single thing to the fullest” is interpreted as **maximum traceable value, not maximum dependency count**. Every source will receive a concrete use: an adopted runtime component, project-owned implementation pattern, architecture comparison, test method, training/reference input, operational control, or explicitly documented non-adoption decision. No repository will be copied, vendored, added as a submodule, hidden as a service, or introduced as a dependency merely to claim that it was used. Each source will have a ledger entry containing its URL, consulted commit/date, license/provenance status, extracted lesson, decision, files or requirements influenced, security implications, tests, and notice impact.

The target deliverable is **submission-ready final project plus a controlled-testnet path**. It is not automatically a production system. Production, organizational pilot, BEL relationship, legal title, independent audit, or external endorsement may only be claimed after actual human approvals and evidence.

## 2. Final-project outcomes

The final project will demonstrate a complete, reproducible workflow using sanitized fixtures:

1. An approved identity adapter authenticates an administrator, manager, auditor, verifier, and ordinary user without treating a wallet address alone as organizational identity.
2. The canonical contract registers identity references, administers roles, mints and allocates unique digital assets, enforces lifecycle transitions, records access decisions, supports controlled transfers, and pauses unsafe operations.
3. The API validates requests, checks current canonical state, creates an explicit transaction preview, tracks signing/submission/confirmation/failure/replacement/staleness, and never reports success before the confirmation policy and expected event are verified.
4. The indexer consumes the generated canonical ABI, stores raw logs and durable projections, detects gaps and duplicates, handles confirmation and reorganization uncertainty, supports replay/backfill, and records reconciliation findings without becoming an authority.
5. The storage boundary classifies permitted payloads, encrypts approved bytes with authenticated envelope encryption, stores only approved references, and authorizes key release through a KMS/HSM boundary without exposing DEKs to the application or browser.
6. The web console provides accessible, localized, role-aware workflows with transaction previews, safe error states, stale/reorg warnings, and explanations of ownership versus legal title and access versus decryption.
7. An independent verifier reproduces contract ownership, lifecycle, events, confirmations, and content commitments from network, contract, ABI, and token inputs rather than trusting cached UI state.
8. CI/CD, SBOM/provenance, reproducible-build, secret-scanning, static-analysis, fuzzing, E2E, accessibility, load, chaos, backup/restore, incident, and governance evidence accompanies the release.

## 3. Non-negotiable constraints

The `SecureAssetPlatform` contract remains canonical for contract-owned facts. API responses, PostgreSQL rows, queues, caches, storage metadata, browser state, AI output, and analytics must never silently override chain ownership, role, identity lifecycle, asset lifecycle, or access-decision facts. Unknown identity, role, scope, policy, network, confirmation, or key-release state must fail closed.

All implementation uses short-lived branches and protected pull requests. No ordinary administrator bypass, self-approval, synthetic collaborator, fake external badge, invented audit, or historical review claim is acceptable. Contract, identity, key, deployment, workflow-permission, privacy, and release changes require the strongest available non-author review; where an eligible reviewer is absent, that remains a release blocker.

No real identity documents, biometrics, credentials, private keys, seed phrases, production secrets, live organizational asset data, or unapproved BEL data may be placed in source, fixtures, logs, browser storage, telemetry, external analytics, or lower environments. The repository remains MIT-licensed. Every external implementation requires provenance, license compatibility, security review, tests, and updated third-party notices.

## 4. Target architecture and default decisions

The existing Python-native direction from ADR 0004 remains the default because the current repository already contains FastAPI, SQLAlchemy/Alembic, persistence models, indexer primitives, and storage boundaries. The project will not introduce Prisma, a TypeScript-only backend, a second ORM, or a second contract stack unless a documented comparison proves a material final-project need.

| Layer | Default final-project choice | Required authority boundary |
|---|---|---|
| Contract | Solidity 0.8.24, Hardhat 3, OpenZeppelin 5.0.2, canonical EVM contract | Chain state/events are authoritative; contract changes require migration and assurance evidence |
| Identity | Approved enterprise OIDC/PKI or approved DID/VC adapter plus EIP-4361 wallet signing where appropriate | Wallet possession is not sufficient organizational assurance |
| API | FastAPI, versioned OpenAPI, strict schemas, canonical reads, transaction intents, idempotency, redaction, rate limits | Never authorize from stale or client-provided facts |
| Database | PostgreSQL, SQLAlchemy 2.x, Alembic, tenant-scoped projections, raw logs, checkpoints, reconciliation findings | Rebuildable read model; no canonical ownership/permission authority |
| Indexer | Confirmed-range read-only worker using generated ABI, durable checkpoints, reorg uncertainty, replay, backfill, reconciliation | No signing, authorization, canonical repair, or finality claim beyond approved policy |
| Storage | KMS/HSM-backed envelope encryption with approved object store or private IPFS strategy | No plaintext sensitive payloads, DEKs, wrapping keys, or private keys in app/browser/logs |
| Web | Next.js/React/TypeScript, project-owned accessible components, localized flows, independent verifier | UI is a presentation and intent layer, not an authority |
| Jobs | BullMQ/Redis-style queue for retryable non-canonical work | Queue cannot grant access, assign ownership, or approve privileged writes |
| Operations | Docker Compose for local integration; OpenTofu or approved IaC for governed deployment | Images, providers, secrets, environments, and approvals are explicit |
| Optional capabilities | Search, WebSockets, AI, analytics, mobile, desktop, payments, ML/ETL only after a demonstrated requirement | Every optional capability has an ADR, threat model, license review, and removal path |

### Hosting and execution decision

The first final-project milestone is a reproducible local/containerized stack: local EVM, FastAPI, PostgreSQL, Redis, object-storage test service, indexer worker, and web console. The deployment target for a controlled testnet is selected only after comparing managed web hosting, an always-on worker host, a user-controlled machine, and a cloud server against Python runtime support, Docker, fixed IP, resource limits, data residency, secret management, cost, recovery, and monitoring requirements. A paid or custom host is not selected merely because it is available.

## 5. Reference-utilization operating system

Before implementation, create `docs/reference-ledger.md` or an equivalent machine-readable ledger and preserve the existing `docs/REFERENCED-REPOSITORIES.md`, `docs/REFERENCE-INTEGRATION.md`, and `THIRD-PARTY-NOTICES.md`. Each row must include:

| Field | Required content |
|---|---|
| Identity | Repository URL, name, upstream owner, consulted commit/date |
| Provenance | License indicator, copied material status, notice obligations, supply-chain risk |
| Value | Specific problem, design lesson, code pattern, test pattern, or operational practice |
| Decision | Runtime adoption, project-owned pattern, comparison only, optional extension, or rejected |
| Implementation | ADR/spec/issue/PR/file influenced |
| Assurance | Tests, static analysis, privacy/security review, license review, operational evidence |
| Boundary | What must not be claimed or integrated |
| Maintenance | Upstream monitoring owner, update cadence, sunset/revalidation condition |

Every adopted lesson is implemented in project-owned code where possible. A source is not “fully used” if it is only linked in a README; it must influence a requirement, design decision, test, training artifact, or implementation review. A source is also not “fully used” if its license, security, or terms-of-service constraints are ignored.

## 6. Complete use matrix for every supplied source

### 6.1 The original 15 curated blockchain, identity, asset, and storage repositories

| Source | Full-value use | Final-project decision and gate |
|---|---|---|
| [SpruceID SSI][r01] | Design identity adapter boundaries for credential parse, verify, sign, presentation, status, and key lifecycle; create sanitized VC interoperability fixtures | Pattern/adaptor candidate; select standards/runtime and verify Apache-2.0 obligations before adoption |
| [Sol DID][r02] | Compare DID method syntax, controller, resolution, rotation, and deactivation to the EVM identity-reference contract | Adapter candidate only; no Solana or `did:sol` dependency without DID/network ADR |
| [OpenZeppelin Contracts][r03] | Continue using ERC-721, AccessControl, and Pausable primitives; track advisories, upgrade diffs, and security assumptions | Current runtime dependency; exact pin, MIT notice, regression/static/fuzz review required |
| [NFT Minting DApp Starter][r04] | Derive wallet connection, network switching, mint preview, receipt, error, and disconnect UX test cases | Project-owned UI pattern; client threat model and accessibility tests required |
| [Markkop NFT Marketplace][r05] | Compare listings, ownership, metadata, search, and marketplace state to the enterprise asset model | Not core scope; legal/title, escrow, royalty, abuse, and business approval required |
| [Polygon NFT Marketplace][r06] | Evaluate IPFS/CID, network configuration, marketplace indexing, and metadata availability | Informational storage/network input; encryption, pinning, privacy, and governance required |
| [NFT Auction Platform][r07] | Extract auction state-machine, bidding abuse, timeout, escrow, and event-test ideas for a future extension | Out of final core scope unless business owner, legal, custody, and anti-abuse gates close |
| [FIWARE Decentralized IAM][r08] | Shape separation between enterprise identity, API policy, and ledger roles; derive deny-by-default policy tests | Adopted pattern; adapter design, assurance, security, and license review required |
| [NFT Credential Management System][r09] | Model credential-to-asset references, expiry, revocation, verification, and user-facing trust explanations | Pattern candidate; credential/privacy/recovery/lifecycle approval required |
| [FileChain][r10] | Strengthen content commitment, integrity, independent verification, substitution detection, and audit evidence | Pattern candidate; crypto/storage/retention tests required |
| [encryptoNFT][r11] | Compare encrypted asset references, DRM/key-release boundaries, and post-decryption leakage risks | Pattern candidate; cryptographic review, KMS/HSM decision, BSD-3-Clause notice review |
| [Fileverse Self-Hosted Public Drive][r12] | Evaluate self-hosting, private retrieval, availability, federation, and operational ownership | Reference-only by default; GPL-3.0 compatibility and deployment threat model before code/assets |
| [Hyperledger Sawtooth Asset Management][r13] | Compare permissioned ledger asset modeling, validator governance, privacy, and finality to EVM choices | Network alternative only; validator/governance/privacy/licensing ADR required |
| [Heka Identity Platform][r14] | Evaluate DIDComm, AnonCreds, OpenID4VC, SD-JWT-VC, wallet, and credential adapter boundaries | Pattern input; protocol choice, privacy, interoperability, and Apache-2.0 notice required |
| [WeIdentity][r15] | Derive enterprise trust, credential lifecycle, recovery, offboarding, governance, and audit responsibilities | Governance pattern; organizational trust model and recovery/audit approval required |

Only OpenZeppelin is currently a runtime dependency. The other 14 remain explicitly curated references until their gates are satisfied.

### 6.2 Universal engineering and full-stack sources

| Source | Full-value use in the project | Output |
|---|---|---|
| [sindresorhus/awesome][r16] | Maintain a source-discovery index for future gaps; document why every new dependency was selected | Dependency decision log |
| [Pro Git][r17] | Standardize branch, rebase, bisect, signed tags, recovery, release, and repository training | Git workflow guide and exercises |
| [Choose a License][r18] | Reconfirm MIT project license and create an external-license decision process | License ADR and notice audit |
| [Conventional Commits][r19] | Enforce `feat`, `fix`, `test`, `docs`, `security`, `chore`, and breaking-change conventions | Commit lint/release/changelog policy |
| [Cookiecutter][r20] | Create reproducible templates for new services, adapters, runbooks, ADRs, test fixtures, and evidence bundles | Project template package; no runtime dependency |
| [Plane][r21] | Convert the 187-item register and reference ledger into owned epics, dependencies, sprints, risks, and release gates | Project board and issue/RACI mapping |
| [Open Source Guides][r22] | Improve CONTRIBUTING, issue forms, PR templates, maintainer guide, release process, and community boundaries | Contribution/governance documentation |
| [Google Engineering Practices][r23] | Define review checklist, small-PR policy, reviewer responsibilities, readability/security review, and author response norms | Review standard and sampled review audit |
| [n8n][r24] | Evaluate low-risk workflow automation for notifications, report generation, evidence reminders, and integration glue | Optional self-hosted automation ADR; Sustainable Use license, patching, isolation, and no-security-authority gate |
| [Excalidraw][r25] | Create context, trust-boundary, data-flow, key-flow, state-machine, reorg, incident, and deployment diagrams | Reviewed diagrams linked from architecture and demo |
| [create-t3-app][r26] | Compare TypeScript full-stack conventions, tRPC, schema ownership, and auth ergonomics against the FastAPI decision | Architecture comparison; no duplicate stack unless justified |
| [create-t3-turbo][r27] | Evaluate monorepo/shared-package/mobile scaling if a real second client is approved | Future monorepo ADR; do not add complexity prematurely |
| [Full Stack FastAPI Template][r28] | Compare FastAPI/React/PostgreSQL/Docker/GitHub Actions structure and deployment patterns | Backend/container reference and gap checklist |
| [Bulletproof React][r29] | Apply feature-oriented client structure, state boundaries, testing, linting, and error conventions | `apps/web` structure and front-end coding standard |
| [RealWorld][r30] | Use auth, CRUD, pagination, routing, validation, and error scenarios as a cross-stack baseline | API/UI scenario matrix |
| [Spring Boot RealWorld][r31] | Compare REST/GraphQL/DDD boundaries and service layering to avoid accidental route coupling | Backend architecture review |
| [React PetClinic][r32] | Study role-aware workflows, navigation, forms, validation, and maintainable React page composition | UI workflow reference |
| [shadcn/ui][r33] | Build accessible project-owned components, tokens, dialogs, forms, tables, badges, and status surfaces | `packages/ui` or project component library with provenance |
| [axe-core][r34] | Automate WCAG checks for all critical views and gate regressions | CI accessibility artifacts plus manual review |
| [i18next/react-i18next][r35] | Make all user-facing messages, validation, audit states, and education translatable; localize dates/numbers | Locale catalogs, language switch, translation tests |
| [Prisma][r36] | Perform explicit comparison with SQLAlchemy/Alembic; use schema/migration lessons without introducing a second ORM | ADR-0004 comparison appendix |
| [Better Auth][r37] | Compare passkeys, 2FA, SSO, sessions, and multitenancy capabilities to the approved FastAPI identity boundary | Auth decision matrix; no hand-rolled identity claims |
| [BullMQ][r38] | Implement bounded retryable jobs for indexing, notifications, scanning, reconciliation, and reports | Queue adapter, retry/dead-letter tests, non-canonical boundary |
| [MinIO][r39] | Provide a disposable local S3-compatible test target for storage integration and outage/restore tests | Local-only profile until AGPLv3 distribution/hosting decision is approved |
| [Vercel AI SDK][r40] | Evaluate optional sanitized assistant for documentation/search/help; support structured output and tool boundaries | AI ADR, prompt/privacy/logging/evaluation tests; never access authority/key-release path |
| [OWASP Cheat Sheets][r41] | Turn auth, session, XSS, SQLi, file upload, SSRF, logging, secrets, and authorization guidance into negative tests | Application security checklist and regression suite |
| [Cypress Real World App][r42] | Adopt seeded data, authenticated E2E, failure-state, database-reset, and CI artifact patterns | Browser E2E harness and evidence artifacts |
| [GitHub Starter Workflows][r43] | Compare official CI/CD patterns for JS, Python, containers, security scans, release, and deployment | SHA-pinned workflows with component-aware gates |
| [Docker Awesome Compose][r44] | Build local multi-service Compose profiles with health checks, dependency ordering, isolated networks, and safe defaults | Reproducible integration environment |
| [free-for-dev][r45] | Compare hosting, database, storage, monitoring, CI, and testnet options using current limits and data terms | Hosting/vendor decision matrix; no stale pricing claims |
| [Umami][r46] | Evaluate privacy-first usage analytics for non-sensitive product usage only | Optional analytics ADR, privacy review, no identifiers/content/keys |
| [Build Your Own X][r47] | Use targeted educational exercises for HTTP, Redis, queues, storage, and database failure modes | Developer training and threat-model workshops, not production replacements |
| [cal.diy][r48] | Study large Next.js/React/Tailwind modularity, permissions, scheduling, and operational patterns | Scalability/design review |
| [System Design Primer][r49] | Perform capacity, consistency, caching, queue, HA, failure, and cost tradeoff analysis | Architecture decision records and capacity plan |
| [Developer Roadmap][r50] | Create role-based learning paths for Solidity, identity, backend, data, frontend, accessibility, security, and operations | Contributor onboarding plan |
| [Project-Based Learning][r51] | Convert each subsystem into a practice milestone with a reproducible lab and acceptance test | Training labs and onboarding evidence |

### 6.3 Situational tooling: use when the problem is demonstrated

| Source | Trigger and fullest safe use | Default decision |
|---|---|---|
| [Meilisearch][r52] / [Typesense][r53] | Add when PostgreSQL search is insufficient for asset/audit discovery; benchmark typo tolerance, field authorization, deletion/retention, tenant filters, and stale-index behavior | Compare both; choose one only with a search ADR; never index secrets or unauthorized fields |
| [Socket.IO][r54] / [Soketi][r55] | Add when users need live transaction/indexer status; test reconnect, auth, backpressure, stale events, and tenant isolation | Prefer Socket.IO unless Pusher protocol compatibility specifically selects Soketi |
| [TanStack Query][r56] / [SWR][r57] | Add client server-state synchronization, refetch, stale markers, optimistic updates, and rollback | Prefer TanStack Query for richer critical-state control; compare SWR for lighter read-only surfaces |
| [React Hook Form][r58] + [Zod][r59] | Implement validated identity, asset, access, and transaction-preview forms with shared schemas | Use unless an existing framework provides equivalent validated forms |
| [Gitleaks][r60] + [Infisical][r61] | Scan working tree/history/artifacts and compare runtime secret injection against approved custody | Gitleaks CI default; Infisical only after vendor/license/hosting review; never put secrets in `.env.example` |
| [Scalar][r62] / [Swagger UI][r63] | Publish versioned OpenAPI for operators, integrators, and auditors | Use Scalar for modern reference UI and retain standard OpenAPI compatibility; use Swagger UI if ecosystem compatibility requires it |
| [Redis][r64] | Provide rate limiting, caching, queue backend, locks, and job state only where failure behavior is defined | Add only with bounded TTL, tenant isolation, no authority, and outage tests |
| [NATS][r65] / [Kafka][r66] | Add NATS for lightweight event fan-out or Kafka only when durable enterprise-scale streaming is proven necessary | Neither is default; BullMQ/Redis first; event streams must not become authorization authority |
| [Kong][r67] | Add gateway for TLS termination, rate limits, routing, request IDs, and policy enforcement when multiple services or external consumers exist | Compare against current reverse proxy; require gateway threat model and configuration tests |
| [Payload CMS][r68] / [Strapi][r69] | Add only for approved non-canonical educational/document content; never for identity, asset authority, or access policy | Prefer no CMS for final core; choose one only after content ownership and security review |
| [Motion][r70] / [GSAP][r71] | Add restrained, reduced-motion-aware transitions for transaction progress, dialogs, and status changes | Prefer Motion for React UI; GSAP only for a genuinely complex timeline |
| [Storybook][r72] | Add when the component library has enough states to require isolated documentation and visual regression | Storybook becomes required before the UI component set grows beyond maintainable manual review |
| [OpenTofu][r73] / [Terraform][r74] / [Pulumi][r75] | Define infrastructure as code, state encryption, provider pinning, review, drift detection, and reproducible environments | Prefer OpenTofu for the open-source default; compare Pulumi for typed Python/TS; Terraform only with explicit BSL/commercial-policy approval |
| [k6][r76] | Load-test API, indexer, database, queue, RPC, storage, and verifier endpoints with safe synthetic data | Required before testnet/pilot capacity claims |

### 6.4 Beyond-web and adjacent data/ML sources

| Source | Full-value use | Boundary |
|---|---|---|
| [Medusa][r77] / [Lago][r78] | Use only if the final scope introduces paid subscriptions, usage metering, or a marketplace; otherwise use as comparative domain modeling | Payments are out of core SIH scope; no financial integration without legal, custody, fraud, and compliance gates |
| [Tauri][r79] / [Electron][r80] | Evaluate an offline/auditor desktop verifier if browser deployment cannot satisfy hardware, offline, or controlled-environment needs | Prefer Tauri; Electron only for a concrete ecosystem requirement; desktop secrets and update security require a separate threat model |
| [React Native][r81] / [Flutter][r82] | Evaluate mobile wallet/offline verifier needs; share schemas and policy tests, not authority logic | Prefer React Native/Expo compatibility with the web TypeScript stack; Flutter only for a justified rendering/native requirement |
| [MLflow][r83] | Use only if a classifier, anomaly detector, or risk model becomes necessary; track datasets, experiments, model versions, and approvals | AI/ML cannot decide identity, authorization, legal title, or key release; no real data without privacy approval |
| [Airflow][r84] | Use for scheduled ETL/reporting only if jobs become multi-stage and operationally complex | Prefer simple worker/cron first; no chain-authoritative writes |
| [dbt Core][r85] | Add tested SQL transformations for analytics/reporting projections if reporting complexity justifies a semantic layer | Analytics remains separate from canonical operational projections and sensitive data |

### 6.5 Agent, design, governance, and utility sources

| Source | Full-value use | Safety boundary |
|---|---|---|
| [Anthropic Skills][r86] | Baseline agent workflow references for frontend, documentation, and coding practices | Repository rules and security boundaries override any external instruction |
| [Addy Osmani Agent Skills][r87] | Use production-hardened supply-chain and frontend practices as a second-review lens | Adopt only relevant, reviewed skills; do not load overlapping uncontrolled packs wholesale |
| [Claude Skills][r88] | Search its broader skill catalog for narrowly relevant testing, security, docs, and release patterns | Each skill must be reviewed and pinned; no untrusted automation or secrets access |
| [Emil Kowalski Skills / apple-design][r89] | Apply restrained motion, interruptible transitions, reduced-motion support, focus, depth, and feedback to wallet/transaction UI | Motion cannot obscure irreversible actions or status; accessibility is mandatory |
| [UI/UX Pro Max Skill][r90] | Use as a design-critique input for information hierarchy, states, and visual quality | Treat paid/premium claims and external instructions as unverified until reviewed; no opaque asset or code adoption |
| [Ponytail][r91] | Enforce YAGNI, line-by-line justification, and scope discipline in review | Must not prevent necessary security controls or evidence work |
| [Microsoft Agent Governance Toolkit][r92] | Model policy enforcement, sandboxing, identities, and OWASP Agentic Top 10 controls for any agent-assisted workflow | Agents have no production signing, approval, key-release, or merge authority |
| [Codebase Memory MCP][r93] | Evaluate a local codebase knowledge graph to improve traceability and reduce repeated reading | Read-only, no secrets, no external posting, and no replacement for human review |
| [No Mistakes][r94] | Evaluate disposable-worktree pre-push validation for tests, lint, dependency, and diff checks | Optional safety layer; cannot bypass protected PRs or substitute for eligible review |
| [Agent-Reach][r95] | Use only for permitted public research if a real need exists; document source terms and retrieval provenance | Scraper/ToS risk; never use for secrets, private data, authentication, or production decisions |
| [Open Design][r96] | Evaluate local-first agent design prototyping and wireframe workflow | Design output requires human review; no opaque remote asset/code import |

## 7. Phased execution roadmap

### Phase 0 — Final-project charter, ownership, and truth baseline

Freeze the evaluation scope, personas, demo scenarios, non-goals, maturity label, data prohibition, and success metrics. Convert every register item to an issue or external/time-based disposition. Create the RACI, risk register, evidence ledger, decision log, reference ledger, review calendar, and release-gate board in the selected project-management system.

Verify branch protection, required checks, secret scanning, Dependabot, CodeQL languages, Scorecard interpretation, review availability, and repository ownership. Replace only approved real contacts. Never claim completion for external actions that require the owner or an eligible collaborator.

**Exit:** all work has owners and dependencies; the chosen final-project boundary is approved; the repository still truthfully says prototype/final-project rather than production.

### Phase 1 — Requirements, diagrams, UX, and reference activation

Use Excalidraw to produce system context, trust boundaries, data placement, key flow, transaction state, indexer/reorg flow, storage flow, incident flow, and deployment diagrams. Use the reference ledger to map every source above to at least one requirement, test, implementation decision, review, training lab, or explicit non-adoption.

Write personas and journeys for administrator, manager, auditor, verifier, subject, and incident operator. Define accessibility, language, support, data classification, ownership-versus-title, access-versus-decryption, and recovery education requirements before client code.

**Exit:** `PROBLEM-STATEMENT-TRACEABILITY.md`, architecture, threat model, acceptance criteria, reference ledger, data dictionary outline, and UI wireframes agree.

### Phase 2 — Domain, identity, event, and deployment ADRs

Resolve DID/VC/OIDC/PKI, identity assurance, key rotation, offboarding, recovery, role graph, tenant scope, asset lifecycle, physical binding, access policy, event versioning, upgradeability, network, custody, storage, hosting, and legal-title decisions. Compare EVM, permissioned EVM, and Fabric/Sawtooth-inspired governance without claiming a network is approved.

Define versioned contract events, canonical commitments, API schemas, projection schemas, storage envelope metadata, audit fields, and migration rules. Decide whether the current contract is frozen for the final demo or changes through a reviewed breaking migration.

**Exit:** ADRs and data dictionary are approved; dependent teams have stable interfaces.

### Phase 3 — Contract completion and independent assurance

Implement only the approved domain changes. Complete positive, negative, event, pause, expiry, offboarding, recovery, callback, reentrancy, malformed-input, and revert-state tests. Expand Echidna/fast-check sequences, retain corpora/seeds, enforce gas budgets, run Slither and artifact reproducibility, and commission a legitimate independent contract review.

**Exit:** all findings are closed or formally risk-accepted; approved ABI, source/artifact hashes, event schema, and verifier instructions exist.

### Phase 4 — Identity and authentication

Implement the selected provider or DID/VC adapter. Test issuer/audience/domain/URI/chain/nonce/issued-at/expiry/signature algorithm/key rotation/replay/session/account-change/offboarding/recovery. Map identity assurance to contract references without storing raw identity data.

**Exit:** actual provider/DID method, owner, privacy basis, test vectors, and security review exist; no fake auth remains.

### Phase 5 — PostgreSQL, indexer, and reconciliation worker

Pin/hash-lock the PostgreSQL driver. Run real PostgreSQL migration, concurrency, tenancy, retention, backup, and restore tests. Complete the indexer worker with generated ABI validation, raw-log retention, confirmed range, provider failover, rate limits, metrics, backfill, gap detection, reorg uncertainty, replay, and deterministic reconciliation. Add operator-approved non-canonical repair and bounded commands.

**Exit:** clean database and chain range rebuild the projection; API/UI expose canonical, confirmed, pending, stale, uncertain, and reconciled states.

### Phase 6 — Storage, KMS/HSM, and permitted payloads

Finalize classification, envelope encryption, storage choice, malware/type/size controls, retrieval, retention, legal hold, erasure limitations, and KMS/HSM lifecycle. Test tamper, wrong key/context, substitution, nonce, downgrade, expiry, revocation, KMS denial, outage, backup, restore, and post-decryption-copy boundaries.

**Exit:** no secrets or plaintext sensitive data leak; KMS/storage/privacy owners approve the design and drills.

### Phase 7 — API business routes and transaction coordinator

Implement versioned routes for identity, roles, assets, lifecycle, access, storage references, audit, recovery/offboarding, verification, and transaction intents. Use Zod or equivalent only at the TypeScript boundary and strict Pydantic/OpenAPI schemas in FastAPI. Publish Scalar/Swagger-compatible OpenAPI. Add idempotency, authorization, canonical freshness, rate limiting, CORS/TLS/proxy controls, safe errors, and full transaction states.

**Exit:** API contract and failure tests pass; no route reports success before canonical confirmation.

### Phase 8 — Web console, independent verifier, and optional clients

Implement the web console with Bulletproof React structure, project-owned shadcn components, TanStack Query or a documented lighter alternative, React Hook Form/Zod validation, i18next, axe, responsive layouts, reduced-motion-aware Motion animation, Storybook when component complexity warrants it, and transaction-state education. Add Cypress-derived E2E tests.

Build the independent verifier page/CLI. Evaluate React Native/Expo-compatible mobile or Tauri desktop only if the final scope needs mobile wallet, offline audit, or controlled-environment verification. Do not build both mobile and desktop merely to consume references.

**Exit:** critical web flows, accessibility, stale/failure/recovery states, browser secret-leak checks, and verifier independence pass.

### Phase 9 — Jobs, realtime, search, API gateway, and content extensions

Add BullMQ/Redis for indexing retries, scans, notifications, reconciliation scheduling, and reports. Add Socket.IO/Soketi only for live status if polling is inadequate. Add Meilisearch/Typesense only if PostgreSQL search is insufficient and only with tenant/retention/stale-index controls. Add Kong only when multiple services or external consumers justify a gateway. Add Payload/Strapi only for approved non-authoritative documentation/content; do not use CMS data for identity or authorization.

Choose NATS/Kafka only when job queues cannot meet a proven streaming requirement. Use n8n only for low-risk integrations and reports, isolated and patched, with its licensing boundary visible.

**Exit:** each optional subsystem has a benchmark, threat model, failure test, license review, and removal path.

### Phase 10 — AI/ML/data and privacy-safe analytics

Create an AI ADR before using Vercel AI SDK or any model. AI may summarize sanitized audit reports, explain documentation, assist search, or classify non-sensitive metadata. It may not decide identity, access, ownership, legal title, key release, deployment, or risk acceptance. Add prompt injection, tool authorization, output validation, privacy, retention, cost, model drift, and human-review tests.

Use MLflow only if an approved model exists; Airflow only if ETL becomes genuinely multi-stage; dbt only for tested analytics transformations. Keep ML/analytics data separate from canonical operational projections. Use Umami only after privacy review and without sensitive identifiers. No real identity or organizational data enters ML or analytics.

**Exit:** AI/data components are optional, auditable, reproducible, human-reviewed, and incapable of exercising authority.

### Phase 11 — IaC, CI/CD, supply chain, observability, and DR

Use Docker Awesome Compose patterns for local integration with health checks and pinned images. Use OpenTofu as the default open-source IaC comparison choice, with Pulumi evaluated for typed stacks and Terraform only after explicit licensing/policy review. Use GitHub starter workflow patterns, SHA-pinned actions, exact locks, Gitleaks, dependency review, SBOM, provenance/attestation, image scanning, artifact reproducibility, release protection, and scheduled checks.

Instrument metrics and redacted logs across UI/API/queue/transaction/indexer/storage/audit. Add alerts for denials, role changes, pause, suspicious mint/transfer, reorg, drift, RPC/provider failures, queue poison messages, authentication anomalies, and key-release failures. Define RTO/RPO, backups, restore/reconcile order, incident severity, escalation, containment, communication, and evidence preservation.

**Exit:** clean checkout and independent rebuild work; monitoring, alert, backup/restore, chaos, and incident evidence is retained.

### Phase 12 — Full integration, performance, chaos, and final assurance

Run the complete sanitized stack. Cover identity, roles, assets, access, transfer, pause, encrypted storage, key denial, transaction replacement, stale/reorg state, reconciliation, restore, verifier, and audit export. Use k6 for load; run provider, database, queue, storage, KMS, signer, browser, migration, and reorg chaos. Add manual accessibility, privacy, legal/records, supply-chain, penetration, and claims reviews.

**Exit:** every chosen final-project criterion has an artifact, owner, and linked issue/PR/release; all P0/P1 findings are fixed or formally accepted with expiry.

### Phase 13 — Testnet/evaluation release and maturity decision

Complete network, finality, custody/multisig, deployment allowlist, manifest, source/ABI verification, smoke test, monitoring, pause, incident, support, and sanitized-data approvals. Produce the final demo script and evidence package with happy-path and denial/failure paths. Label the release `submission-ready final project`, `controlled testnet`, `pilot`, or `production` based only on completed gates.

Production is a separate decision and requires independent contract/application assurance, KMS/HSM custody, network governance, HA/DR, legal/privacy/records approval, real contacts, formal risk acceptance, and signed go/no-go.

## 8. Workstream-to-evidence matrix

| Workstream | Main register/issue families | Evidence required |
|---|---|---|
| Contract/identity | `SC-*`, identity, role, asset, event, deployment ADRs | Tests, fuzz/static/gas, audit/retest, ABI, manifest, verifier |
| API/auth | `API-*`, `QA-04`, `COM-*` | OpenAPI, provider decision, replay/auth/authorization/idempotency tests |
| Database/indexer | `IDX-*`, `QA-05`, `QA-10` | PostgreSQL integration, rebuild, worker, reorg/backfill/drift/restore |
| Storage/privacy | `DATA-*`, `COM-02`–`COM-10` | Classification, crypto/KMS/storage tests, privacy/retention, restore/revocation |
| Web/mobile/desktop | `UI-*`, `QA-07` | E2E, axe/manual accessibility, wallet safety, verifier, browser leak review |
| Optional subsystems | search/realtime/queues/AI/analytics/ETL | ADR, benchmark, threat model, license, failure tests, removal path |
| Operations | `OPS-*`, `OBS-*` | IaC, image scan, deployment, metrics, alerts, chaos, incident, RTO/RPO |
| Supply chain | `SCM-*`, `REF-*` | Locks, SBOM, provenance, license scan, secret scan, reference ledger |
| Governance | `GOV-*`, `DOC-*` | Non-author review, CODEOWNERS, contacts, RACI, risk acceptance, release approval |

## 9. Validation matrix

Every phase runs focused checks before merge and the complete gate before a maturity transition.

| Area | Required validation |
|---|---|
| Repository | Frozen installs, reference/URL/license validation, Markdown/link/config validation, secret scans over history and artifacts, provenance, `git diff --check` |
| Contract | Unit/negative/event matrix, properties, Echidna, receiver/reentrancy, gas, Slither, compiler/artifact reproducibility, independent audit |
| Identity | Provider/DID conformance, signature/nonce/domain/URI/chain/audience/expiry/key rotation/replay/session/offboarding/recovery |
| API | OpenAPI, schema, authorization, canonical freshness, concurrency/idempotency, transaction states, rate limits, redaction, CORS/TLS/CSRF |
| Database/indexer | Real PostgreSQL migrations, concurrency, duplicate/gap/retry/reorg/backfill/restore, raw events, finality, drift/repair |
| Storage | Classification, KAT/tamper/wrong-key/context/nonce/downgrade, KMS IAM/release/rotation/revocation, malware/type/size/outage/restore |
| Client | Wallet/identity, previews, chain/account changes, permission rendering, stale/failure/recovery, E2E, axe/manual, i18n, secret-leak |
| Optional tools | Benchmark and outage tests for search, realtime, queue, gateway, CMS, AI, analytics, ETL, mobile/desktop |
| Operations | Compose/IaC, image digest, deployment dry run, alert tests, chaos, incident, RTO/RPO, restore/reconcile |
| Governance | Protected review, CODEOWNERS, release approvals, privacy/legal, vendor risk, support, contacts, formal risk acceptance |

## 10. Release evidence package

Each final release must contain an executive summary, SIH traceability, architecture and threat model, data dictionary, reference/license ledger, ADR index, API/OpenAPI, contract ABI and manifest, verifier instructions, migration/rebuild instructions, indexer/reconciliation report, storage/KMS design, sanitized demo artifacts, E2E/accessibility reports, fuzz/static-analysis reports, SBOM/provenance, load/chaos/DR evidence, incident/runbooks, risk register, reviewer records, known limitations, and maturity/go-no-go decision.

The package must state that passing CI proves workflow execution, not independent audit, historical review, legal title, BEL endorsement, OpenSSF registration, or production readiness. Every unresolved item must list status, owner, mitigation, expiry/review date, and maturity levels blocked.

## 11. Critical path and parallelization

The non-negotiable critical path is: scope/ownership → domain/identity/event ADRs → contract assurance → approved authentication/custody → PostgreSQL/indexer → API workflows → storage/KMS → web/verifier → optional subsystems → integration/chaos/accessibility → testnet/evaluation release. Reference-ledger work, wireframes, contributor training, contract fuzzing, documentation, and vendor comparisons can proceed in parallel. Optional search, realtime, CMS, AI, ML, payments, desktop, and mobile work must not delay the core final-project path unless explicitly included in the evaluation scope.

## 12. Assumptions and open decisions

This plan assumes “Final Project” means an evaluation-ready integrated prototype and controlled-testnet path, not an immediate production launch. It assumes the current Python persistence/indexer direction remains preferred and that the original 15 references must remain visible even when not runtime-integrated.

Architecture materially changes when the owner selects: identity provider/DID method; assurance authority; testnet/production network; validator governance; HSM/KMS vendor; object store/private IPFS; target jurisdiction/data residency; tenancy model; physical-asset binding; supported languages; hosting; support SLA; and whether auctions, marketplace, payments, AI, ML, mobile, or desktop are inside the submission.

External blockers cannot be solved by code: legitimate non-author reviewers, organization teams/CODEOWNERS, monitored contacts, OpenSSF registration, independent audit/penetration testing, privacy/legal/records approval, network/custody approval, vendor risk acceptance, and signed go/no-go. These must be tracked honestly.

## 13. Definition of done

The final project is complete only when every selected feature has implementation, success and failure tests, synchronized documentation/configuration, owner, threat-model impact, migration/rollback notes, license/provenance record, operational evidence, and a linked acceptance artifact. Every supplied source has a traceable use or an explicit gated/rejected decision. The system demonstrates both successful and denied operations, canonical verification, stale/reorg/recovery behavior, and its limitations. No source is represented as runtime-integrated unless it actually is.

## References

### Original 15 curated repositories

[r01]: https://github.com/spruceid/ssi "SpruceID SSI"
[r02]: https://github.com/identity-com/sol-did "Sol DID"
[r03]: https://github.com/OpenZeppelin/openzeppelin-contracts "OpenZeppelin Contracts"
[r04]: https://github.com/tomhirst/nft-minting-dapp-starter "NFT Minting DApp Starter"
[r05]: https://github.com/Markkop/nft-marketplace "Markkop NFT Marketplace"
[r06]: https://github.com/obinnafranklinduru/NFT-MarketPlace "Polygon NFT Marketplace"
[r07]: https://github.com/furkanenesdagli/NFT_auction "NFT Auction Platform"
[r08]: https://github.com/FIWARE/decentralized-iam "FIWARE Decentralized IAM"
[r09]: https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem "NFT Credential Management System"
[r10]: https://github.com/akash70629/FileChain "FileChain"
[r11]: https://github.com/El-hacen21/encryptoNFT "encryptoNFT"
[r12]: https://github.com/fileverse/self-hosted-public-drive "Fileverse Self-Hosted Public Drive"
[r13]: https://github.com/hkhuang07/asset-management-sawtooth "Hyperledger Sawtooth Asset Management"
[r14]: https://github.com/hiero-ledger/heka-identity-platform "Heka Identity Platform"
[r15]: https://github.com/WeBankBlockchain/WeIdentity "WeIdentity"

### Engineering and full-stack references

[r16]: https://github.com/sindresorhus/awesome "Awesome"
[r17]: https://github.com/progit/progit2 "Pro Git"
[r18]: https://github.com/github/choosealicense.com "Choose a License"
[r19]: https://www.conventionalcommits.org/ "Conventional Commits"
[r20]: https://github.com/cookiecutter/cookiecutter "Cookiecutter"
[r21]: https://github.com/makeplane/plane "Plane"
[r22]: https://opensource.guide/ "Open Source Guides"
[r23]: https://google.github.io/eng-practices/ "Google Engineering Practices"
[r24]: https://github.com/n8n-io/n8n "n8n"
[r25]: https://github.com/excalidraw/excalidraw "Excalidraw"
[r26]: https://github.com/t3-oss/create-t3-app "create-t3-app"
[r27]: https://github.com/t3-oss/create-t3-turbo "create-t3-turbo"
[r28]: https://github.com/fastapi/full-stack-fastapi-template "Full Stack FastAPI Template"
[r29]: https://github.com/alan2207/bulletproof-react "Bulletproof React"
[r30]: https://github.com/gothinkster/realworld "RealWorld"
[r31]: https://github.com/gothinkster/spring-boot-realworld-example-app "Spring Boot RealWorld"
[r32]: https://github.com/spring-petclinic/spring-petclinic-reactjs "React PetClinic"
[r33]: https://github.com/shadcn-ui/ui "shadcn/ui"
[r34]: https://github.com/dequelabs/axe-core "axe-core"
[r35]: https://github.com/i18next/i18next "i18next/react-i18next"
[r36]: https://github.com/prisma/prisma "Prisma"
[r37]: https://github.com/better-auth/better-auth "Better Auth"
[r38]: https://github.com/taskforcesh/bullmq "BullMQ"
[r39]: https://github.com/minio/minio "MinIO"
[r40]: https://github.com/vercel/ai "Vercel AI SDK"
[r41]: https://github.com/OWASP/CheatSheetSeries "OWASP Cheat Sheet Series"
[r42]: https://github.com/cypress-io/cypress-realworld-app "Cypress Real World App"
[r43]: https://github.com/actions/starter-workflows "GitHub Starter Workflows"
[r44]: https://github.com/docker/awesome-compose "Docker Awesome Compose"
[r45]: https://github.com/ripienaar/free-for-dev "free-for-dev"
[r46]: https://github.com/umami-software/umami "Umami"
[r47]: https://github.com/codecrafters-io/build-your-own-x "Build Your Own X"
[r48]: https://github.com/calcom/cal.diy "Cal.diy"
[r49]: https://github.com/donnemartin/system-design-primer "System Design Primer"
[r50]: https://github.com/kamranahmedse/developer-roadmap "Developer Roadmap"
[r51]: https://github.com/practical-tutorials/project-based-learning "Project-Based Learning"

### Situational, beyond-web, data/ML, and agent/design references

[r52]: https://github.com/meilisearch/meilisearch "Meilisearch"
[r53]: https://github.com/typesense/typesense "Typesense"
[r54]: https://github.com/socketio/socket.io "Socket.IO"
[r55]: https://github.com/soketi/soketi "Soketi"
[r56]: https://github.com/TanStack/query "TanStack Query"
[r57]: https://github.com/vercel/swr "SWR"
[r58]: https://github.com/react-hook-form/react-hook-form "React Hook Form"
[r59]: https://github.com/colinhacks/zod "Zod"
[r60]: https://github.com/gitleaks/gitleaks "Gitleaks"
[r61]: https://github.com/Infisical/infisical "Infisical"
[r62]: https://github.com/scalar/scalar "Scalar"
[r63]: https://github.com/swagger-api/swagger-ui "Swagger UI"
[r64]: https://github.com/redis/redis "Redis"
[r65]: https://github.com/nats-io/nats-server "NATS"
[r66]: https://github.com/apache/kafka "Apache Kafka"
[r67]: https://github.com/Kong/kong "Kong"
[r68]: https://github.com/payloadcms/payload "Payload CMS"
[r69]: https://github.com/strapi/strapi "Strapi"
[r70]: https://github.com/motiondivision/motion "Motion"
[r71]: https://github.com/greensock/GSAP "GSAP"
[r72]: https://github.com/storybookjs/storybook "Storybook"
[r73]: https://github.com/opentofu/opentofu "OpenTofu"
[r74]: https://github.com/hashicorp/terraform "Terraform"
[r75]: https://github.com/pulumi/pulumi "Pulumi"
[r76]: https://github.com/grafana/k6 "k6"
[r77]: https://github.com/medusajs/medusa "Medusa"
[r78]: https://github.com/getlago/lago "Lago"
[r79]: https://github.com/tauri-apps/tauri "Tauri"
[r80]: https://github.com/electron/electron "Electron"
[r81]: https://github.com/facebook/react-native "React Native"
[r82]: https://github.com/flutter/flutter "Flutter"
[r83]: https://github.com/mlflow/mlflow "MLflow"
[r84]: https://github.com/apache/airflow "Apache Airflow"
[r85]: https://github.com/dbt-labs/dbt-core "dbt Core"
[r86]: https://github.com/anthropics/skills "Anthropic Skills"
[r87]: https://github.com/addyosmani/agent-skills "Addy Osmani Agent Skills"
[r88]: https://github.com/alirezarezvani/claude-skills "Claude Skills"
[r89]: https://github.com/emilkowalski/skills "Emil Kowalski Skills / apple-design"
[r90]: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill "UI/UX Pro Max Skill"
[r91]: https://github.com/DietrichGebert/ponytail "Ponytail"
[r92]: https://github.com/microsoft/agent-governance-toolkit "Microsoft Agent Governance Toolkit"
[r93]: https://github.com/DeusData/codebase-memory-mcp "Codebase Memory MCP"
[r94]: https://github.com/kunchenguid/no-mistakes "No Mistakes"
[r95]: https://github.com/Panniantong/Agent-Reach "Agent-Reach"
[r96]: https://github.com/nexu-io/open-design "Open Design"

## Repository documents to maintain during implementation

Continue synchronizing `docs/COMPREHENSIVE-IMPROVEMENT-AND-FIX-REGISTER.md`, `complete-fix-execution-plan.md`, `ARCHITECTURE.md`, `docs/REFERENCE-INTEGRATION.md`, `docs/REFERENCED-REPOSITORIES.md`, `THIRD-PARTY-NOTICES.md`, `docs/PROBLEM-STATEMENT-TRACEABILITY.md`, `docs/THREAT-MODEL.md`, `docs/ACCEPTANCE-CRITERIA.md`, compliance, ADRs, runbooks, changelog, security status, and the new reference ledger. Every status must remain one of implemented, partial, missing, external action, or time-based, with evidence links.
