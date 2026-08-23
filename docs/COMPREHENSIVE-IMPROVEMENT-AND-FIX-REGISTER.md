# Comprehensive Improvement and Fix Register

**Execution tracker:** [Issue #12 — complete platform remediation and production-readiness gates](https://github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management/issues/12)

**Repository:** Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management
**Scope:** Smart India Hackathon 2026 Problem Statement 26125, Bharat Electronics Limited evaluation context
**Review basis:** Repository state on the consolidated `main` branch, current Scorecard SARIF, local validation results, architecture, threat model, traceability matrix, acceptance criteria, and security policies
**Status:** The repository is an executable Solidity/Hardhat MVP baseline with a comprehensive design suite. It is **not a production platform** until the gates in this register are completed.

> **Purpose.** This register is intentionally exhaustive. It includes work that is already complete but must remain monitored, work that is partially implemented, work that is absent, work that requires GitHub or OpenSSF administration, and work that can only improve with legitimate project history. No alert should be marked resolved merely because a workflow passed or because a narrative statement was added.

## 1. Current baseline and non-negotiable interpretation

The current repository contains the `SecureAssetPlatform` Solidity contract, Hardhat 3 tooling, OpenZeppelin Contracts, unit and negative tests, an Echidna harness, a TypeScript `fast-check` property test, CI, CodeQL, Scorecard, release automation, dependency automation, the requested documentation/reference suite, and stacked remediation branches. The active implementation branch is `feat/api-fail-closed-auth-baseline`; PR #13 is open against PR #11’s branch rather than directly against `main`. These branch facts are operational context, not evidence that the changes are merged or independently reviewed.

The latest validated PR #13 head has passing CI, CodeQL, Echidna, Slither, and Scorecard workflows, including SARIF publication where configured. The latest Scorecard SARIF still reports **SASTID**, **CodeReviewID**, **MaintainedID**, and **CIIBestPracticesID**. Scorecard’s own documentation explains that these checks measure different things: SAST coverage, legitimate human review history, repository age/activity, and an external OpenSSF Best Practices badge respectively.[1] CodeQL is a security analysis engine whose results become GitHub Code Scanning alerts.[2] Passing current workflows therefore proves current execution, not that all historical commits were scanned or reviewed, and it does not satisfy the missing legitimate non-author review or external registration actions.

The implementation is deliberately bounded to a prototype. It now contains partial FastAPI, read-only indexer, SQLAlchemy/Alembic persistence, and local authenticated-encryption/key-release policy reference boundaries, but no business API, approved authentication, ABI-decoding durable worker, PostgreSQL driver/integration, queues, KMS/HSM, object-storage adapter, Next.js client, permissioned-network deployment, physical-asset verifier, production monitoring, independent contract audit, or production approvals. The `.env.example`, architecture, contributor guide, and acceptance criteria describe intended future components; every partial boundary must remain fail-closed and explicitly non-production until its acceptance evidence exists.

## 2.1 Remediation already completed in the current execution

| Completed change | Evidence | Remaining boundary |
|---|---|---|
| Environment schema and validator added; local placeholders are allowed only for local/CI, while testnet/pilot/production policies reject placeholders and unsafe signer/database/RPC settings. | `config/environment.schema.json`, `scripts/validate_environment.py`, CI environment gate | The future services still need their own runtime configuration and startup integration. |
| Repository setup documentation corrected to match the contract-only MVP; absent Python, API, frontend, indexer, and Compose commands were removed from the current quick-start path. | `README.md`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/dependabot.yml`, `.devcontainer/devcontainer.json` | Full-stack commands must be added when their components are implemented. |
| DID-hash uniqueness is enforced through a reverse mapping; duplicate commitments are covered by tests. | `contracts/SecureAssetPlatform.sol`, `contracts/test/SecureAssetPlatform.test.ts` | A real DID method, DID document, resolver, assurance authority, and recovery ceremony remain pending. |
| Empty access actions are rejected, asset lifecycle status is explicit, and manager-controlled per-asset/per-action policy overrides support grant and deny decisions. Suspended assets deny access and transfer; revoked and retired assets cannot return to active status. | `contracts/SecureAssetPlatform.sol`, contract tests, acceptance criteria, threat model | Policy delegation, physical binding, metadata lifecycle, and organizational custody remain pending. |


## 2. Priority and status definitions

| Priority | Meaning | Release rule |
|---|---|---|
| **P0 — security blocker** | A weakness could enable unauthorized control, data exposure, supply-chain compromise, irreversible loss, or misleading assurance. | Must be fixed or formally risk-accepted before any testnet or real data. |
| **P1 — testnet gate** | Required for a controlled testnet or integrated demonstration. | Must have implementation and evidence before testnet approval. |
| **P2 — pilot gate** | Required for bounded organizational use with controlled users/assets. | Must be complete before a pilot. |
| **P3 — production/continuous** | Required for production readiness or ongoing assurance. | Must be approved by accountable owners and continuously monitored. |

| Status | Meaning |
|---|---|
| **Implemented / monitor** | The repository contains a baseline implementation, but regression, independent review, or operations evidence remains necessary. |
| **Partial** | Some implementation or design exists, but an integration, policy, or evidence gate is absent. |
| **Missing** | The capability is described or required but is not implemented in the current repository. |
| **External action** | The change requires a GitHub, OpenSSF, organizational, collaborator, or legal action that cannot be fabricated in source control. |
| **Time-based** | The signal depends on legitimate project age or future activity and cannot be immediately forced by code. |

## 3. Current Code Scanning and Scorecard alerts

| Alert | Finding | Severity shown | Current condition | Complete remediation path | Status |
|---:|---|---|---|---|---|
| **#19** | Maintained | High | The repository is younger than the Scorecard age threshold. Maintenance evidence now includes scheduled workflows, Dependabot, releases, changelog, security policy, contribution rules, and [`MAINTENANCE.md`](../MAINTENANCE.md). | Keep the project active, publish legitimate maintenance changes/releases, update issues and documentation, and reassess after the age threshold. Do not rewrite history or create artificial activity. | **Partial / time-based** |
| **#17** | Code-Review | High | `main` requires pull requests, one approval, last-push approval, conversation resolution, linear history, required checks, and administrator enforcement. Historical direct commits were not approved changesets. | Have a non-author collaborator approve future security-sensitive pull requests. For higher assurance, require two reviewers and code-owner review. Do not self-approve, fabricate a reviewer, or dismiss the finding without evidence. | **Future-process fix / historical limitation** |
| **#20** | SAST | Medium | CodeQL runs successfully on current pushes, pull requests, schedules, and manual dispatch. The Scorecard result reports only a fraction of historical commits with SAST coverage because the workflow was introduced later. | Keep CodeQL enabled, scan every new change, use the correct language configuration, review alerts, and preserve workflow history. Historical commits cannot be retroactively scanned by a workflow that did not exist at those revisions. | **Current control fixed / historical limitation** |
| **#16** | CII-Best-Practices | Low | The README links the official OpenSSF Best Practices program and honestly labels the assessment pending. Scorecard checks the external Best Practices service, not merely a README link.[3] | The repository owner must authenticate at [bestpractices.dev project registration](https://www.bestpractices.dev/en/projects/new), register the repository, complete the passing criteria, maintain the answers, and add the real project badge URL. | **External action required** |

### 3.1 GitHub controls to keep verified

1. Keep `main` protected with at least one required non-author review, require approval of the latest push, dismiss stale approvals, require conversation resolution, require the branch to be up to date, prevent force pushes and deletion, require status checks, and include administrators where practical.
2. Move from a single-person `CODEOWNERS` file to approved organization teams before production. Contracts, workflows, dependency policy, deployment configuration, identity, privacy, and storage must each have independent owners.
3. Require two reviewers and code-owner approval for contract authorization, identity, key-management, workflow-permission, deployment, and privacy changes before production.
4. Require pull requests for all changes, including administrator changes, and do not use administrator bypass for ordinary work.
5. Protect release tags and environments, require environment approvals for production deployment, and document who can deploy, pause, rotate keys, or publish releases.
6. Enable secret scanning, push protection, Dependabot alerts, dependency review, private vulnerability reporting, and security-advisory workflows where the repository plan supports them.
7. Review all required status-check names after workflow renames. A required check that never runs can deadlock merges; a required check that can be bypassed is not a security control.
8. Record branch-policy verification in a repository settings runbook because branch protection is not represented completely by source files.

## 4. Smart-contract remediation register

### 4.1 Identity and DID lifecycle

The contract stores an address-to-`bytes32` DID hash mapping, not a complete DID method or SSI implementation. W3C DID Core defines DIDs as identifiers resolvable to DID documents containing verification methods and services; a hash field alone is not a conforming DID method or resolver.[4]

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| SC-ID-01 | Select and approve one DID method or an enterprise identity bridge. Define method syntax, creation, resolution, update, deactivation, controller semantics, and interoperability constraints. | P0 | Missing decision | ADR, method specification, resolver tests, approved owner and assurance level. |
| SC-ID-02 | Define the DID document and verification-method model, including key types, purposes, controllers, services, and rotation semantics. | P0 | Missing | Versioned schema, valid examples, conformance tests, and interoperability review. |
| SC-ID-03 | Implement DID resolution or a trusted resolver adapter; validate method-specific documents rather than accepting arbitrary hashes. | P1 | Missing | Resolver integration tests, negative malformed-document tests, timeout/failure behavior. |
| SC-ID-04 | Define identity assurance levels and the organizational verification authority. A wallet address must not automatically mean a verified employee or organization. | P0 | Partial in documentation | Approved assurance matrix, verification workflow, evidence retention, and periodic recertification. |
| SC-ID-05 | Enforce DID-hash uniqueness or document the collision/linkability policy. The current reverse mapping prevents two registry addresses from claiming the same non-zero DID hash. | P0 | Implemented for MVP / privacy policy pending | Duplicate-DID tests, explicit reuse/reassignment policy, migration plan. |
| SC-ID-06 | Decide whether an identity may have multiple active keys and model controller/delegate relationships. | P1 | Missing | State model, authorization tests, rotation and revocation events. |
| SC-ID-07 | Add nonce, domain-separation, chain-ID, contract-address, expiry, and audience protection for all off-chain signed authentication and transaction-intent messages. | P0 | Missing because no API exists | EIP-4361-compatible login tests, replay tests, wrong-domain tests, expired-message tests.[5] |
| SC-ID-08 | Implement key rotation and revocation as a formal ceremony with old-key invalidation, replacement proof, approval quorum, and audit evidence. | P0 | Contract replacement baseline exists; ceremony missing | Recovery runbook, two-person approval test, audit record, failed-recovery tests. |
| SC-ID-09 | Define employee offboarding integration, including HR/identity approval, active sessions, credentials, roles, asset custody, and pending transactions. | P0 | Contract-only baseline | Offboarding workflow, integration test, asset-review record, completion audit. |
| SC-ID-10 | Define key-loss, compromise, death/incapacity, and disputed-identity recovery. Do not rely on a single administrator or an irreversible address mapping. | P0 | Missing governance | Recovery policy, multisig or institutional authority, tabletop drill, evidence retention. |
| SC-ID-11 | Define privacy treatment of DID hashes, including dictionary attacks, linkability, public-chain permanence, correlation across assets, and whether salted commitments are appropriate. | P0 | Partial | Privacy threat analysis, approved data-minimization decision, test vectors, legal/privacy review. |
| SC-ID-12 | Add explicit event/version fields for identity registration, status changes, key replacement, revocation reason, actor, policy version, and effective time without exposing personal data. | P1 | Partial | Published event schema, ABI compatibility tests, indexer fixtures, event completeness matrix. |

### 4.2 RBAC, authorization, and administrative control

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| SC-RBAC-01 | Replace or protect the single default administrator with a multisignature or institutional approval authority. | P0 | Missing | Approved custody architecture, multisig deployment, signer inventory, quorum test, rotation drill. |
| SC-RBAC-02 | Define the complete role graph: who may grant/revoke each role, whether administrators can delegate, and whether role administration is scoped. | P0 | Partial | Role matrix, contract tests for every grant/revoke edge, governance approval. |
| SC-RBAC-03 | Decide global, tenant-scoped, asset-scoped, and time-bounded permissions. The current roles are global and do not encode scope or expiry. | P0 | Missing | Authorization model, storage schema, contract/API parity tests, expiry tests. |
| SC-RBAC-04 | Add least-privilege roles for deployment, pause, identity verification, asset registration, metadata approval, audit, and recovery rather than concentrating authority. | P1 | Missing | Role decomposition ADR, role graph review, least-privilege tests. |
| SC-RBAC-05 | Add two-person approval for high-impact operations: administrator changes, key recovery, physical-asset reassignment, bulk actions, pause release, and production deployment. | P0 | Missing | Approval state machine, quorum tests, timeout/cancellation behavior, audit export. |
| SC-RBAC-06 | Add reason, ticket/RFC reference, scope, expiry, and policy version to privileged operations where appropriate. | P1 | Partial | Event and API schema, validation tests, sanitized audit records. |
| SC-RBAC-07 | Define and test behavior when all administrators are inactive, when a role holder is compromised, and when a recovery target is disputed. | P0 | Missing | Emergency governance procedure, liveness/safety tests, approved break-glass process. |
| SC-RBAC-08 | Review the `grantRole` and `revokeRole` overrides against every OpenZeppelin `AccessControl` path and future extension. | P0 | Partial | Full inherited-surface test matrix, static analysis, independent contract review. |
| SC-RBAC-09 | Decide whether default-admin immutability is correct. If it is retained, define a safe institutional migration path; if not, implement controlled admin rotation without ordinary uncontrolled grants. | P0 | Partial | ADR, migration contract/test, recovery proof, deployment runbook. |
| SC-RBAC-10 | Ensure off-chain authorization never trusts client role labels or stale database projections. | P0 | API missing | API authorization tests against canonical chain state and stale/read-model failure cases. |

### 4.3 NFT and digital-asset lifecycle

ERC-721 defines basic functionality for tracking and transferring non-fungible tokens, but the project intentionally disables standard approval paths and adds a manager-only enterprise policy.[6] That constrained interface must be documented, tested, and accepted by every consumer.

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| SC-ASSET-01 | Approve the token standard and compatibility boundary. Decide whether controlled enterprise assets should remain ERC-721-compatible or use a purpose-built non-transferable/permissioned interface. | P0 | MVP decision recorded | ADR, consumer compatibility tests, security/legal review. |
| SC-ASSET-02 | Extend the current contract status enum into the full asset lifecycle: proposed, approved, minted, allocated, verified, suspended, revoked, retired, and recovered. | P1 | Partial: active/suspended/revoked/retired implemented | State machine in contract or authoritative service, transition tests, event schema. |
| SC-ASSET-03 | Define the canonical organizational asset registry and authority for `assetId`; reject stale, reused, ambiguous, or unauthorized physical identifiers. | P0 | `bytes32` uniqueness only | Registry integration, uniqueness tests, reconciliation report, owner approval. |
| SC-ASSET-04 | Implement physical-asset binding with QR/NFC or an approved alternative, including tag issuance, replacement, tamper handling, offline verification, and chain-of-custody records. | P1 | Missing | Verifier prototype, anti-counterfeit tests, custody workflow, acceptance demo. |
| SC-ASSET-05 | Define token metadata and URI policy. The current contract stores a metadata hash but does not expose an encrypted object reference or `tokenURI`. | P1 | Missing | Metadata schema, privacy review, URI/CID access policy, independent verification tool. |
| SC-ASSET-06 | Define metadata update, versioning, revocation, and correction behavior. Decide whether the hash is immutable, append-only, or governed by a controlled update. | P1 | Missing | Contract/service design, migration and event tests, legal/records approval. |
| SC-ASSET-07 | Define burn, retirement, suspension, seizure, and recovery semantics. The MVP now provides controlled suspension, revocation, and retirement status transitions; burn/seizure/recovery governance remains absent. | P0 | Partial: status controls implemented; governance pending | State transitions, role/quorum tests, immutable audit evidence, recovery runbook. |
| SC-ASSET-08 | Test every ERC-721 ownership-change path, including 3-argument and 4-argument safe transfers, `transferFrom`, internal `_update`, mint callbacks, receiver reentrancy, and future extensions. | P0 | Partial: explicit 3-argument/4-argument safe-transfer and malicious receiver callback tests added; independent review/fuzzing pending | Complete path matrix, malicious receiver fixture, reentrancy review, fuzz results. |
| SC-ASSET-09 | Test approval-disabled behavior against wallets, indexers, explorers, and SDKs. A standard consumer may assume approvals work. | P1 | Partial | Compatibility report, explicit errors, integration tests, user-facing explanation. |
| SC-ASSET-10 | Define access policy per asset and action. The MVP now supports manager-controlled requester/action overrides with grant or deny and optional expiry; the default fallback remains owner/manager/auditor policy. | P0 | Partial: contract rule baseline implemented | Policy schema, deny-by-default tests, delegated access tests, expiry/revocation tests. |
| SC-ASSET-11 | Decide whether `requestAccess` should reject nonexistent tokens or record a denial. The MVP rejects empty actions and records non-reverting decisions; reason codes, policy version, and nonexistent-token semantics remain to be approved. | P1 | Partial: empty-action validation implemented | ADR, contract tests, event schema, API behavior specification. |
| SC-ASSET-12 | Add limits and validation for batch operations, asset IDs, metadata commitments, and gas-heavy operations. | P1 | Missing | Boundary tests, gas snapshots, DoS analysis, operational limits. |
| SC-ASSET-13 | Add a canonical asset verification CLI or web tool that works independently of the main UI. | P1 | Missing | Given network/address/ABI/token ID, tool reproduces owner, events, state, and metadata integrity. |
| SC-ASSET-14 | Define legal ownership, custody, possession, operational access, and token ownership as separate records. | P0 | Documented only | Approved legal/records model, custody workflow, user-facing warnings, audit export. |

### 4.4 Contract engineering and deployment safety

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| SC-ENG-01 | Obtain an independent smart-contract security review covering authorization, ERC-721 overrides, identity lifecycle, storage, events, denial-of-service, and deployment assumptions. | P0 | Missing | Signed review report, tracked findings, retest evidence, risk acceptance. |
| SC-ENG-02 | Add Slither or an equivalent Solidity static-analysis gate and publish reviewed findings. | P0 | Partial: pinned Slither 0.11.4 workflow added; local production-surface run found only low timestamp-use findings; remote SARIF review pending | CI report, approved suppressions with rationale, zero unreviewed high findings. |
| SC-ENG-03 | Add compiler-version, optimizer, EVM-target, and dependency compatibility matrix tests. | P1 | One compiler/EVM target | Reproducible matrix, approved supported versions, release evidence. |
| SC-ENG-04 | Strengthen Echidna invariants beyond default-admin and approval checks: role safety, active identities, unique assets, ownership, pause behavior, transfer authority, and event/state consistency. | P0 | Partial: stateful harness now covers DID reverse mappings, inactive-role revocation, asset status bounds, terminal transfer denial, access-rule shape, pause/admin persistence, and existing approval/admin invariants | Fuzz campaign configuration, corpus, run artifacts, failure triage, passing CI. |
| SC-ENG-05 | Add stateful fuzzing sequences for register/deactivate/replace/offboard/grant/revoke/mint/transfer/pause/recover operations. | P0 | Missing | Stateful harness, seed-independent pass, minimized counterexamples. |
| SC-ENG-06 | Add property tests for all error selectors and event arguments, including malformed addresses, zero hashes, duplicate IDs, inactive endpoints, unauthorized callers, and paused state. | P1 | Partial: negative tests now include empty actions, stale/expired access rules, illegal lifecycle transitions, inactive identities, transfer paths, and paused state; full selector/event matrix remains pending | Error/event coverage report and negative-test matrix. |
| SC-ENG-07 | Add invariant checks for total supply, token-owner uniqueness, asset-ID uniqueness, no privileged inactive identities, and no state change on revert. | P0 | Partial | Fuzz and unit evidence linked to invariants. |
| SC-ENG-08 | Add gas snapshots and define operational gas limits for mint, role, identity, transfer, pause, and recovery operations. | P1 | Partial: checked-in local MVP gas ceilings and executable regression tests cover implemented identity, role, mint, transfer, and pause operations; recovery is not implemented | CI gas budget, regression threshold, approved exceptions. |
| SC-ENG-09 | Decide upgradeability. The current contract is not presented as upgradeable; preserve that boundary or design a separately reviewed proxy/migration architecture. | P0 | Decision implicit | ADR, storage-layout policy, upgrade tests or explicit immutability statement. |
| SC-ENG-10 | Make deployment refuse unsafe networks, missing chain IDs, production-like placeholder keys, or an unapproved root administrator. | P0 | Partial: deployment policy, local/CI chain allowlist, chain-ID verification, and deployed-bytecode check implemented; non-local approval/custody remains blocked | Dry-run failure tests, chain allowlist, operator confirmation, deployment policy. |
| SC-ENG-11 | Produce signed deployment manifests containing commit, compiler, optimizer, EVM target, chain ID, RPC identity, contract address, ABI hash, source hash, deployer/multisig, and timestamp. | P1 | Partial: guarded local deployment writes an unsigned manifest with the required hashes and metadata; signature/attestation and external verification remain pending | Versioned manifest, signature/attestation, verified explorer/source record. |
| SC-ENG-12 | Add deployment verification and post-deployment smoke tests for roles, identity, pause, mint, transfer, access decision, events, and ownership. | P1 | Missing | Automated smoke job against a disposable testnet or local network. |
| SC-ENG-13 | Define emergency pause, unpause, migration, and incident communication procedures that do not assume immutable state can be deleted. | P0 | Pause exists; runbook missing | Incident drill, approval record, operator runbook, status template. |

## 5. Identity, API, indexer, and data-platform work

The architecture describes a canonical ledger plus recoverable projections. A database or API must never become the source of ownership truth, and a transaction must not be shown as successful before the required event and confirmation policy are verified.

### 5.1 API and authentication

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| API-01 | Implement the FastAPI service or remove aspirational API commands until implementation exists. A fail-closed boundary now exists with versioned OpenAPI metadata, health/readiness endpoints, secure baseline headers, RPC chain/code readiness checks, and a protected placeholder audit route. | P1 | Partial: boundary implemented; business API pending | Running transaction/audit service, complete OpenAPI document, indexer/database/key-service health checks, and integration tests. |
| API-02 | Implement wallet authentication using a nonce and domain-bound signed message such as EIP-4361; verify address, domain, URI, chain ID, nonce, issued-at, expiration, and session binding.[5] The current API fails closed and refuses unsigned or unverified bearer claims until the approved verifier is integrated. | P0 | Partial: fail-closed boundary; verifier pending | Login/replay/cross-domain/expiry tests, session invalidation, key rotation, and approved OIDC/JWKS or wallet verifier. |
| API-03 | Integrate approved enterprise identity/OIDC/PKI if wallet control is not the organization’s assurance mechanism. | P0 | Missing | Identity-provider design, claims mapping, assurance tests, offboarding integration. |
| API-04 | Enforce server-side authorization for every route using current contract state, application policy, tenant scope, and identity status. | P0 | Partial: deny-by-default contract-aligned authorization matrix and unit tests cover identity activity, roles, ownership, asset lifecycle, and destination activity; route middleware, tenant scope, fresh canonical reads, and stale-projection tests remain pending | Route matrix, deny-by-default tests, stale-projection tests. |
| API-05 | Add input validation, canonicalization, strict schemas, length limits, safe error responses, pagination, request IDs, and consistent error codes. The boundary validates request IDs, returns safe headers, and uses versioned API metadata; business schemas remain pending. | P1 | Partial: boundary controls implemented; app factory now supports explicit settings injection | API contract tests, fuzzed request tests, generated business OpenAPI. |
| API-06 | Add idempotency keys for mint, transfer, allocation, access-release, recovery, and upload operations. A deterministic in-memory reference store now rejects conflicting key reuse and returns the original record for identical retries; it is not a multi-instance production store. | P0 | Partial: reference state machine and a PostgreSQL-oriented unique subject/idempotency schema constraint with isolated test exist; transactional API integration, expiry/retention, and durable production store remain pending | Duplicate-request tests, durable unique database constraint, retry behavior, expiry/retention, and idempotency storage policy. |
| API-07 | Track transaction state as requested, signed, submitted, pending, confirmed, failed, reverted, replaced, or unknown. A typed state machine now rejects illegal transitions and requires a transaction hash after submission begins. | P0 | Partial: state machine implemented; chain worker/UI pending | Timeout/replacement tests, receipt/event confirmation, reorg behavior, durable persistence, and UI-visible status. |
| API-08 | Implement rate limiting, abuse controls, account lockout/step-up authentication, request quotas, and denial monitoring. | P1 | Partial: bounded process-local limiter and unit tests exist; trusted client identity, distributed enforcement, lockout/step-up policy, durable metrics, and route integration remain pending | Load/abuse tests, rate-limit metrics, operator alerts. |
| API-09 | Harden CORS, cookies, CSRF protection where cookies are used, security headers, TLS, proxy trust, origin checks, and secret rotation. The boundary uses an explicit CORS allowlist, disallows credentials, adds baseline security headers, and requires HTTPS RPC/auth trust outside local/CI. | P0 | Partial: boundary controls implemented | Production proxy/TLS configuration, cookie/CSRF decision, secret rotation, and deployment checklist. |
| API-10 | Publish privacy-safe audit APIs with actor pseudonyms, pagination, authorization, export controls, and redaction rules. | P1 | Missing | Data-access tests, export samples, privacy review. |
| API-11 | Decide whether the backend uses Python-native SQLAlchemy/Alembic or a TypeScript/Prisma service; remove unused alternatives from the target architecture. | P1 | Partial: ADR 0004 selects the Python-native PostgreSQL/SQLAlchemy/Alembic direction for the next durable-service phase; runtime dependencies and migration implementation remain pending | ADR, dependency policy, migration ownership. |

### 5.2 Indexer and reconciliation

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| IDX-01 | Implement the event consumer for identity, role, asset, access, transfer, pause, and inherited standard events. | P1 | Partial: read-only RPC scan and strict dependency-free decoder now cover the exact compiled `SecureAssetPlatform` application plus inherited ERC-721 and AccessControl event surface; durable consumer, complete canonical RPC fixtures, persistence wiring, and operational backfill remain pending | Running RPC consumer, complete event fixtures, and operational backfill. |
| IDX-02 | Use idempotent keys such as chain ID, contract address, transaction hash, log index, and event version. | P0 | Partial: typed event key, strict ABI-decoder fixtures, SQLAlchemy uniqueness constraint, transaction-scoped persistent sink, and repository duplicate/conflict tests; PostgreSQL integration and concurrent-write evidence pending | Durable unique database constraint and duplicate-delivery integration tests. |
| IDX-03 | Implement confirmation/finality policy per network and do not expose unconfirmed ownership as final. | P0 | Partial: in-memory and transaction-scoped projections separate unfinalized from canonical events using explicit confirmation depth and promote only at the configured block boundary; network-specific finality configuration and durable pending-state behavior remain pending | Confirmation tests, stale/pending state behavior, policy configuration. |
| IDX-04 | Handle RPC outages, provider failover, rate limits, timeouts, retries, exponential backoff, and bounded queues. | P1 | Partial: bounded retry, exponential backoff, endpoint failover, timeout parameter, and response validation primitives with tests; production metrics, rate limits, and durable queue remain pending | Fault-injection tests and retry metrics. |
| IDX-05 | Detect block gaps, missed logs, duplicate logs, cursor corruption, and incomplete backfills. | P0 | Partial: explicit checkpoint gap detector, contiguous verification, duplicate tests, confirmed-range scanner, and malformed-response tests | Replay command, alerts, RPC fault handling, and recovery report. |
| IDX-06 | Handle chain reorganizations by replaying affected ranges and marking uncertain records. | P0 | Partial: in-memory and transaction-scoped references remove affected checkpoints from derived output, retain affected event records as explicit uncertain history, and clear only matching replay identities; canonical reorg worker remains pending | Reorg simulation against an approved RPC, uncertainty states, and reconciliation evidence. |
| IDX-07 | Periodically reconcile projected ownership, roles, identity status, and asset mappings against canonical contract reads. | P0 | Partial: read-only deterministic drift reporter covers missing, unexpected, and mismatched projection records; live canonical reads, scheduled execution, repair approval, and evidence persistence remain pending | Drift test, reconciliation report, repair approval. |
| IDX-08 | Design database migrations, indexes, retention, tenant isolation, encryption, backup, restore, and least-privilege database accounts. | P0 | Partial: ADR 0004 establishes PostgreSQL with SQLAlchemy/Alembic; local models, repository constraints, initial Alembic upgrade test, and a fail-closed engine factory cover transaction intents, canonical events, checkpoints, and reconciliation findings; the official `DATABASE_URL` contract is used by migrations, SQLite is limited to disposable environments, and non-local PostgreSQL requires secure SSL settings. PostgreSQL driver/integration, tenant isolation, encryption, backup/restore, and access evidence remain pending | Migration tests, restore drill, schema review, access review. |
| IDX-09 | Define event schema versioning and backward-compatible handling for contract upgrades or new event fields. | P1 | Missing | Versioned schema, migration fixtures, compatibility tests. |
| IDX-10 | Provide operator commands for start block, backfill range, replay, pause, resume, dead-letter retry, and consistency verification. | P1 | Missing | Runbook and tested commands. |

### 5.3 Queue and workflow safety

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| Q-01 | Implement durable jobs only for non-canonical work; never let a queue decide authorization. | P1 | Missing | Job ownership matrix and authorization tests. |
| Q-02 | Make every job idempotent, bounded, observable, and cancelable. | P1 | Missing | Retry/dead-letter/duplicate tests. |
| Q-03 | Add poison-message handling, operator replay approval, queue backpressure, and retention policy. | P1 | Missing | Fault-injection report and dashboard. |
| Q-04 | Separate user-visible transaction workflows from eventual indexing and notification jobs. | P0 | Missing | State diagram, API contract, failure tests. |

## 6. Encryption, IPFS, storage, privacy, and records

The design correctly states that IPFS/CIDs do not provide confidentiality and that encrypted payloads, not plaintext, must be stored externally. Encryption must use authenticated encryption with a secure key lifecycle; NIST key-management guidance covers generation, protection, use, rotation, recovery, and destruction.[7] AES-GCM’s nonce/tag handling must follow the approved cryptographic profile.[8]

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| DATA-01 | Implement an approved payload-classification service that rejects raw identity documents, biometrics, secrets, or regulated data unless explicitly approved. | P0 | Design only | Classification rules, rejection tests, privacy owner approval. |
| DATA-02 | Implement envelope encryption with fresh cryptographically random 256-bit DEKs, AES-256-GCM or approved equivalent, unique nonces, authentication tags, algorithm/version metadata, and associated-data binding. | P0 | Partial: local reference AES-256-GCM envelope, fresh nonce, version/algorithm metadata, associated-data binding, serialization, and tamper tests implemented; managed key lifecycle and storage adapter remain pending | Known-answer tests, tamper tests, nonce tests, crypto review. |
| DATA-03 | Protect DEKs with KMS/HSM envelope wrapping; never place DEKs, wrapping keys, private keys, or credentials in source, logs, browser code, or events. | P0 | Missing: the local envelope accepts caller-supplied keys and the policy-only release boundary returns no key material; no KMS/HSM, wrapping, IAM, or custody exists | KMS design, IAM policy, audit logs, key-rotation test, secret scan. |
| DATA-04 | Define key hierarchy, tenant separation, purpose binding, versioning, rotation, re-wrapping, revocation, recovery, destruction, and dual control. | P0 | Missing: key-release metadata includes purpose and version, but the hierarchy and lifecycle controls are not implemented | Key-management policy, rotation/recovery drill, evidence export. |
| DATA-05 | Implement controlled key release after identity, role, asset, policy, confirmation, and approval checks. A successful on-chain access decision must not automatically release a key. | P0 | Partial: `services/storage/key_release.py` is a fail-closed policy reference requiring active requester/key state, matching `GRANTED` evidence, expiry validation, and an audit request ID; it returns authorization metadata only, has no authentication or canonical-read integration, and is not a KMS release path | End-to-end authorization tests, denial tests, expiry/revocation tests. |
| DATA-06 | Choose IPFS versus object storage, define pinning providers, replication, availability, gateway policy, private retrieval, CID leakage controls, and content removal limitations. | P1 | Missing | Storage ADR, availability test, recovery drill, threat model update. |
| DATA-07 | Bind the on-chain commitment to canonical encrypted bytes and metadata, preventing substitution, version confusion, or algorithm downgrade. | P0 | Partial | Commitment format, tamper/substitution tests, verifier implementation. |
| DATA-08 | Add secure upload/download paths with size/type limits, malware scanning, content disarm where needed, signed URLs, expiration, authorization, audit, and no plaintext caching. | P0 | Missing | Upload abuse tests, cache/header review, malware-test fixtures, audit records. |
| DATA-09 | Define retention, deletion, legal hold, backup retention, revocation, subject-rights handling, and immutable-ledger limitations. | P0 | Design only | Privacy/legal review, policy matrix, deletion/retention tests. |
| DATA-10 | Complete a privacy impact assessment and data-flow inventory for identity, asset, event, logs, analytics, backups, and third-party services. | P0 | Missing | Approved PIA/DPIA, data inventory, processor/subprocessor list. |
| DATA-11 | Minimize personal data in events, token metadata, CIDs, logs, error messages, screenshots, fixtures, and telemetry. | P0 | Policy only | Automated secret/PII checks, red-team review, fixture audit. |
| DATA-12 | Add backup encryption, key separation, restore verification, geographic/residency policy, RPO/RTO, and immutable backup protection. | P1 | Missing | Restore drill, RPO/RTO report, backup access review. |
| DATA-13 | Add DLP, watermarking, controlled viewers, endpoint restrictions, or other organizational controls for post-decryption copying risk. | P2 | Missing | Approved residual-risk decision and control test. |

## 7. Frontend, wallet, accessibility, and user safety

The intended client is not implemented. Any future web/mobile client must treat the wallet as a signing device, not as proof of organizational identity, and must make transaction scope and authorization state understandable. WCAG 2.2 provides the accessibility baseline for perceivable, operable, understandable, and robust interfaces.[9]

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| UI-01 | Implement the Next.js/React web console or remove unsupported start commands from user documentation until it exists. | P1 | Missing | Running client, production build, deployment manifest. |
| UI-02 | Implement mobile/wallet adapter strategy, supported wallets, hardware-wallet behavior, chain switching, account changes, and disconnect handling. | P1 | Missing | Wallet compatibility matrix and end-to-end tests. |
| UI-03 | Display network, chain ID, contract address, method, parameters, asset, recipient, fees, and expected impact before every privileged signature. | P0 | Missing | Transaction-preview tests and phishing review. |
| UI-04 | Never display client-provided role labels or cached ownership as authoritative; refresh critical state from API/canonical chain. | P0 | Missing | Stale-state and permission-rendering tests. |
| UI-05 | Implement clear pending, confirmed, failed, reverted, replaced, stale, and reconciliation-warning states. | P0 | Missing | E2E transaction-state tests. |
| UI-06 | Implement identity, roles, assets, access decisions, audit, recovery, and offboarding screens with separate privileges and redaction. | P1 | Missing | Role-based E2E matrix and privacy review. |
| UI-07 | Meet WCAG 2.2 baseline: keyboard navigation, focus, labels, headings, contrast, errors, status announcements, timing, responsive layout, and reduced-motion behavior. | P1 | Missing | axe or equivalent report plus manual keyboard/screen-reader review. |
| UI-08 | Add Cypress or Playwright tests for login, role assignment, mint, allocation, access denial/grant, transfer, pause, recovery, failed transaction, and stale indexer states. | P1 | Missing | CI E2E artifacts and failure triage. |
| UI-09 | Prevent sensitive payloads, keys, tokens, and decrypted content from browser logs, analytics, crash reports, local storage, and URLs. | P0 | Missing | Browser instrumentation review and automated checks. |
| UI-10 | Add user education for token ownership versus legal title, access permission versus decryption, irreversible signatures, and recovery limits. | P1 | Missing | Content review and usability test. |

## 8. Infrastructure, network, and deployment governance

The current deployment script is intentionally for a disposable local/test network. Production requires an approved network, validator/operator governance, finality and reorganization policy, custody, monitoring, privacy, and data-residency evidence.

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| OPS-01 | Select the production network: permissioned EVM, private Polygon, Fabric-compatible architecture, or another approved network. | P0 | Open ADR | Decision record, threat model, cost/performance, privacy, finality, residency, and operator approval. |
| OPS-02 | Define validator/operator membership, onboarding/offboarding, key custody, quorum, upgrades, incident response, and governance. | P0 | Missing | Network governance policy and tabletop exercise. |
| OPS-03 | Define chain finality, confirmation depth, reorg tolerance, fork handling, RPC trust, provider diversity, and chain-ID validation. | P0 | Missing | Network policy, simulator tests, monitoring thresholds. |
| OPS-04 | Use HSM/KMS or approved custody for deployment and privileged signing. Remove long-lived private-key assumptions from `.env.example` for production. | P0 | Missing | Custody architecture, IAM review, signing drill, rotation evidence. |
| OPS-05 | Implement deployment environments, approvals, chain allowlists, dry runs, manifests, source verification, and post-deployment smoke tests. | P0 | Partial: local/CI policy, dry-run guardrails, chain/code checks, and manifest generation implemented; testnet approvals/source verification/smoke tests pending | Testnet deployment evidence and operator checklist. |
| OPS-06 | Define release, migration, rollback, pause, emergency, and immutable-state communication policies. | P0 | Partial | Approved runbooks, dry-run logs, release artifact links. |
| OPS-07 | Add high-availability RPC, database, queue, storage, and monitoring architecture with dependency failure behavior. | P1 | Missing | Resilience test, failover evidence, capacity plan. |
| OPS-08 | Define RTO/RPO, backup frequency, restore order, reconciliation after restore, and disaster-recovery ownership. | P1 | Missing | Full restore drill and signed report. |
| OPS-09 | Define environments and data boundaries: local, CI, development, testnet, pilot, production. Prohibit real identity data in lower environments. | P0 | Partial | Environment matrix, policy enforcement, sanitized fixtures. |
| OPS-10 | Add infrastructure-as-code, reviewed configuration, secret references, image provenance, network policy, TLS, firewall policy, and least-privilege service accounts. | P1 | Missing | IaC plan, security review, deployment test. |

## 9. Observability, audit, and incident response

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| OBS-01 | Define operation/correlation IDs across UI, API, queue, transaction, event, indexer, storage, and audit export. | P1 | Design only | Trace example and propagation tests. |
| OBS-02 | Instrument transaction success/revert/replacement rates, confirmation latency, indexing lag, gaps, reorgs, drift, queue retries, RPC errors, auth failures, and denied access. | P1 | Missing | Metrics catalog, dashboards, alerts, synthetic tests. |
| OBS-03 | Enforce structured logs with redaction and no keys, authorization headers, plaintext, DEKs, raw identity data, or sensitive CIDs. | P0 | Policy only | Log-redaction tests and sampled audit. |
| OBS-04 | Protect audit logs from alteration, define retention, access, export, time synchronization, and evidence chain. | P0 | Missing | Tamper-evidence design, access review, export verification. |
| OBS-05 | Add alerts for unauthorized role changes, pause/unpause, suspicious mint/transfer patterns, repeated denials, key-release anomalies, signer failures, and indexer drift. | P1 | Missing | Alert rules, test events, on-call acknowledgement. |
| OBS-06 | Implement incident severity, escalation, containment, communication, evidence preservation, post-incident review, and regulatory/legal coordination. | P0 | Policy narrative only | Incident runbook and tabletop exercise. |
| OBS-07 | Define security contact ownership and replace `security@example.com` before any public or production launch. | P0 | Placeholder | Monitored private channel, response SLA, ownership rota, test report. |
| OBS-08 | Define vulnerability disclosure, CVE/advisory, patch, backport, and release communication procedures. | P1 | Partial | Published policy, test advisory, release checklist. |

## 10. CI/CD, supply chain, and repository hygiene

The repository has strong baseline hardening: workflow actions are pinned to commit SHAs, permissions are constrained, CodeQL and Echidna run, and the Hardhat 2/`elliptic` dependency path was removed. The remaining work is to keep the controls accurate as the intended full stack is added. SLSA provides a useful vocabulary for build provenance and tracing artifacts back to source and build inputs.[10]

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| SCM-01 | Keep every GitHub Action pinned to a reviewed immutable SHA and document the action version/comment. | P0 | Implemented / monitor | Automated SHA-pinning test and Dependabot review. |
| SCM-02 | Pin Docker base images and service images by digest when Docker or production images are introduced. | P0 | Missing for future stack | Digest policy and image scan report. |
| SCM-03 | Add SBOM generation for dependencies, containers, contracts, and release artifacts. | P1 | Missing | SPDX/CycloneDX artifacts attached to releases. |
| SCM-04 | Add artifact attestations/provenance and verify them before release or deployment. | P1 | Missing | Signed provenance, verification job, release evidence. |
| SCM-05 | Add dependency-review gating for new vulnerabilities, licenses, transitive changes, and unexpected package additions. | P1 | Partial | PR gate, approved allowlist, failure test. |
| SCM-06 | Continue `pnpm audit --audit-level=moderate`, frozen installs, lockfile review, and exact-version review for security-sensitive tooling. The API now has an exact, hash-locked Python requirements artifact installed with `--require-hashes`; unused verifier dependencies were removed until genuine authentication code exists. | P0 | Partial: JS and Python reproducibility baselines implemented / monitor | Passing CI, scheduled review, Python lock refresh review, documented exceptions. |
| SCM-07 | Review all pnpm overrides periodically; remove overrides that are no longer necessary and record why each remains. | P1 | Partial | Override inventory and quarterly review. |
| SCM-08 | Add license and provenance scanning for all dependencies and curated references; verify that no reference repository is accidentally vendored. | P1 | Partial | License report, third-party notice review, CI check. |
| SCM-09 | Enable secret scanning and push protection; scan Git history and artifacts, not only the working tree. | P0 | Must verify in GitHub | Clean report and prevention test. |
| SCM-10 | Add CodeQL coverage for Python, YAML/actions, and future languages when those components are implemented; do not claim coverage for absent code. | P0 | JavaScript/TypeScript current | Language matrix, successful runs, alert triage. |
| SCM-11 | Add Solidity static analysis and dependency scanning separate from CodeQL because CodeQL does not replace contract-specific analysis. | P0 | Partial: pinned Slither workflow added; dependency and finding review remain ongoing | CI reports and reviewed suppressions. |
| SCM-12 | Add fuzzing campaign retention, corpus artifacts, deterministic seeds for triage, and scheduled longer runs. | P1 | Minimal Echidna/fast-check baseline | CI artifacts, scheduled run, failure replay. |
| SCM-13 | Make CI fail rather than silently pass when an expected component is absent. The service test gate now discovers every Python test under `services`, while component-specific configuration remains explicitly conditional. | P1 | Partial: combined service discovery gate implemented | Explicit component matrix and failure policy for each future service. |
| SCM-14 | Remove or correct unused CI services and environment variables until PostgreSQL, Redis, and the API/indexer exist. PostgreSQL/Redis service containers were removed when the API boundary was introduced; durable dependencies remain staged. | P1 | Partial: unused containers removed; database/queue architecture pending | CI duration/resource review and accurate service matrix. |
| SCM-15 | Add change-impact routing so contract/workflow/security/data changes require security and domain reviewers. | P0 | Single-owner CODEOWNERS | Team-based CODEOWNERS and PR enforcement. |
| SCM-16 | Protect release tags, use environment approvals, and restrict release-token permissions to the minimum required operations. | P0 | Permissions partially hardened | Settings verification and release dry run. |
| SCM-17 | Add reproducible-build verification for contract artifacts, frontend bundles, containers, and release archives. | P1 | Missing | Independent rebuild hash comparison. |
| SCM-18 | Review semantic-release behavior so tags, changelog changes, npm settings, and GitHub releases cannot bypass the required pull-request process. | P1 | Automated release exists | Release threat model and dry-run evidence. |

## 11. Configuration and documentation consistency

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| DOC-01 | Either implement `services/api`, `services/indexer`, `apps/web`, `packages/*`, and Docker Compose or label every related command and configuration value as planned. | P1 | Partial: API boundary, indexer, storage, and persistence primitives exist; full routes, database integration, queue, frontend, and Compose remain explicitly staged | Clean-checkout command audit. |
| DOC-02 | Correct `CONTRIBUTING.md` and `.github/PULL_REQUEST_TEMPLATE.md` commands that invoke missing `services/api/requirements.txt` and `services/api/tests`. | P1 | Implemented: commands use the tracked API lock and service test layout | Commands work or are explicitly marked future-stage. |
| DOC-03 | Correct `.github/dependabot.yml` entries for pip ecosystems and `/services/api` if those manifests do not exist. The `/services/api`, `/services/storage`, and `/services/persistence` pip ecosystems now cover tracked direct requirements and hashed locks. | P1 | Implemented / monitor | Dependabot configuration matches tracked manifests. |
| DOC-04 | Correct `.devcontainer/devcontainer.json`: do not use `|| true` to hide install failures; make component setup deterministic and fail visibly. | P1 | Permissive setup | Rebuild devcontainer from clean checkout with expected failure behavior. |
| DOC-05 | Reconcile `.env.example` with the actual contract topology. It now names one combined MVP contract and labels future service settings as staged. | P1 | Implemented for current MVP / monitor future service additions | Environment schema validation and documented migration. |
| DOC-06 | Mark every placeholder endpoint, password, signer key, S3 value, session secret, and contact address as local-only and ensure production startup rejects placeholders. | P0 | Partial | Startup validation and secret scan. |
| DOC-07 | Add machine-readable environment schema and validate required variables, formats, allowed chain IDs, URLs, and secret strength. | P1 | Partial: schema and dependency-free validator implemented; service-specific startup validation continues | Schema tests and startup failure tests. |
| DOC-08 | Keep README, architecture, roadmap, acceptance criteria, threat model, compliance report, ADRs, changelog, and security status synchronized with actual implementation. | P1 | Ongoing | Documentation consistency CI and release checklist. |
| DOC-09 | Publish contract ABI, deployment records, event schema, supported network matrix, and verifier instructions for every accepted deployment. | P1 | Partial: manifest schema and guarded local deployment record exist; accepted-network matrix and independent verification walkthrough pending | Versioned artifacts and independent verification walkthrough. |
| DOC-10 | Add diagrams for trust boundaries, data flow, key flow, transaction state, indexer reconciliation, and incident response. | P2 | Partial | Reviewed diagrams linked from architecture. |
| DOC-11 | Replace placeholder security/support contacts with approved monitored channels before public launch. | P0 | Placeholder | Contact test and ownership record. |
| DOC-12 | Keep `THIRD-PARTY-NOTICES.md`, reference catalog, integration matrix, and license boundaries current; do not imply that reference repositories are integrated runtime code unless they are actually adopted. | P1 | Implemented / monitor | Reference validator and quarterly review. |
| DOC-13 | Add an explicit data dictionary for every on-chain field, event field, off-chain record, identifier, hash, CID, and audit field. | P1 | Missing | Data dictionary reviewed by security/privacy and implementation owners. |
| DOC-14 | Add versioned migration notes whenever a contract event, role, metadata commitment, environment variable, API route, or storage schema changes. | P1 | Policy exists; implementation absent | Migration template and sample migration. |

## 12. Governance, ownership, and human assurance

| ID | Improvement or fix | Priority | Current state | Acceptance evidence |
|---|---|---:|---|---|
| GOV-01 | Recruit at least one independent contract/security reviewer who is not the change author and has sufficient repository permissions. | P0 | Missing | Approved PRs with reviewer identity and review scope. |
| GOV-02 | Add approved organization teams to CODEOWNERS for contracts, security workflows, identity, privacy, infrastructure, and releases. | P0 | Single owner | Team ownership and successful CODEOWNERS enforcement. |
| GOV-03 | Require two-person review for privileged contract, deployment, key, identity, privacy, and workflow changes. | P0 | One reviewer currently required | Branch policy and PR evidence. |
| GOV-04 | Link every security-sensitive change to an issue, RFC, ADR, threat-model update, migration plan, and acceptance evidence. | P1 | Process documented | Review checklist and sampled PR audit. |
| GOV-05 | Record risk owner, mitigation, expiry/review date, residual risk, and approval authority for every accepted risk. | P1 | Missing register | Risk register with owner and expiry. |
| GOV-06 | Define conflict-of-interest handling and independent approval when a maintainer is involved in the decision. | P1 | Policy narrative | Governance test case and role assignments. |
| GOV-07 | Define release authority, deployment authority, key-custody authority, incident authority, and emergency authority separately. | P0 | Roles documented but concentrated | RACI, access review, break-glass log. |
| GOV-08 | Complete OpenSSF Best Practices registration and maintain answers as code, processes, and team structure change. | P1 | External action | Registered project, passing assessment, real badge URL. |
| GOV-09 | Build legitimate review history through normal reviewed PRs. Do not generate empty commits, self-approvals, or artificial collaborators to manipulate Scorecard. | P0 | Historical signal remains | Subsequent reviewed PRs and review-quality audit. |
| GOV-10 | Treat Scorecard’s Maintained age signal as time-based; continue real maintenance rather than rewriting history. | P2 | Time-based | Ongoing releases/issues and later Scorecard reassessment. |

## 13. Testing and quality-assurance matrix

| ID | Improvement or fix | Priority | Required evidence |
|---|---|---:|---|
| QA-01 | Maintain unit tests for all successful and rejected contract paths. | P0 | Partial: 15 Solidity tests cover successful/rejected identity, RBAC, asset, access-rule, lifecycle, transfer/callback, approval, pause, and gas-budget paths; full error/event matrix remains pending. |
| QA-02 | Add stateful property tests for identity, RBAC, assets, access, pause, and recovery sequences. | P0 | Partial: expanded Echidna stateful harness and fast-check identity property suite; CI run artifacts and broader recovery sequences pending. |
| QA-03 | Add malicious ERC-721 receiver and callback/reentrancy fixtures. | P0 | Partial: test-only receiver attempts manager-only reentrant transfer and is blocked; broader fuzz/gas review pending | Passing callback, reentrancy, gas, and state-integrity tests. |
| QA-04 | Add API contract, authentication, authorization, replay, idempotency, and transaction-state tests. | P0 | FastAPI boundary, explicit-settings HTTPX tests, deny-by-default authorization tests, bounded rate-limit tests, transaction state-machine tests, and CI report; business API/provider tests remain pending. |
| QA-05 | Add indexer duplicate, gap, retry, reorg, confirmation, backfill, drift, and restore tests. | P0 | Dependency-free duplicate, checkpoint-gap, block-conflict, rollback with uncertain orphan retention, matching replay, confirmation-depth, RPC failover, malformed-response, deterministic drift, and persistence repository conflict tests; PostgreSQL integration, backfill, repair, and restore evidence pending. |
| QA-06 | Add storage encryption, tamper, key-release, revocation, expiry, malware, size, and availability tests. | P0 | Partial: AES-GCM round-trip, serialization, tamper, associated-data, and invalid-input tests; key-release, revocation, expiry, malware, size, availability, and KMS evidence remain pending. |
| QA-07 | Add frontend end-to-end, accessibility, permission-rendering, wallet, error, and stale-state tests. | P1 | Cypress/Playwright and axe/manual reports. |
| QA-08 | Add performance/load tests for API, indexer, database, queue, storage, RPC, and contract gas limits. | P1 | Partial: preliminary local contract gas-budget regression exists; service/load/capacity baselines remain pending. |
| QA-09 | Add chaos/failure tests for RPC, storage, DB, queue, signer, KMS, and indexer outages. | P1 | Fault-injection report and safe degraded behavior. |
| QA-10 | Add backup/restore and disaster-recovery tests, including post-restore reconciliation. | P1 | Missing: migration upgrade coverage exists, but no PostgreSQL backup/restore or post-restore reconciliation drill has been performed. | Signed drill report with RPO/RTO results. |
| QA-11 | Add independent penetration testing for API, wallet flows, authorization, storage, and deployment surfaces. | P0 | Scope, report, remediation, retest, and risk acceptance. |
| QA-12 | Add independent smart-contract audit and verify all findings are closed or approved. | P0 | Signed audit report, issue tracker, retest evidence. |
| QA-13 | Define coverage thresholds that distinguish line coverage from meaningful security-invariant coverage. | P1 | CI threshold and documented exceptions. |
| QA-14 | Add mutation testing or equivalent negative-test adequacy review for authorization and lifecycle logic. | P2 | Mutation report and remediation. |

## 14. Compliance, privacy, legal, and organizational readiness

| ID | Improvement or fix | Priority | Required evidence |
|---|---|---:|---|
| COM-01 | Obtain written confirmation of the intended evaluation relationship and avoid claiming BEL ownership, endorsement, authorization, or deployment. | P0 | Approved communication or explicit disclaimer. |
| COM-02 | Identify applicable privacy, cybersecurity, records, procurement, and data-residency obligations for the target organization and deployment. | P0 | Legal/privacy applicability assessment. |
| COM-03 | Define lawful basis, consent/notice, purpose limitation, minimization, retention, erasure limitations, access/correction, revocation, and breach handling for identity data. | P0 | Approved privacy policy and data-flow controls. |
| COM-04 | Define whether any on-chain commitment can be personal data through linkability or reversibility, and document the treatment. | P0 | Privacy threat analysis and legal review. |
| COM-05 | Define records-management and evidentiary requirements for audit logs, transaction receipts, approvals, custody, and physical-asset records. | P1 | Records policy and export validation. |
| COM-06 | Define legal meaning and disclaimer for NFT ownership, physical possession, custody, and organizational title. | P0 | Legal approval and user-facing language. |
| COM-07 | Define accessibility, inclusion, language, training, and support requirements for target operators and auditors. | P1 | Accessibility/usability plan and training evidence. |
| COM-08 | Complete supplier/third-party risk review for OpenZeppelin, IPFS providers, KMS, RPC, hosting, CI, wallets, and monitoring. | P1 | Vendor inventory, contracts, risk decisions, exit plan. |
| COM-09 | Define audit, inspection, incident notification, and regulatory cooperation responsibilities. | P1 | RACI and incident/legal runbook. |
| COM-10 | Establish security and support contacts that are real, monitored, and approved before any external launch. | P0 | Contact verification and rota. |

## 15. Reference-repository and licensing controls

The 15 supplied repositories remain curated references, not automatically integrated runtime components. Keep the distinction explicit and preserve the current catalog, adoption matrix, and third-party notices.

| ID | Improvement or fix | Priority | Acceptance evidence |
|---|---|---:|---|
| REF-01 | Revalidate all 15 canonical URLs and repository names periodically. | P2 | Passing `validate:references` and review record. |
| REF-02 | Record the exact version/commit consulted when a reference influences implementation. | P1 | Integration matrix with commit/date and rationale. |
| REF-03 | Verify license compatibility before copying code, schemas, assets, or documentation. | P0 | License review and approved notice. |
| REF-04 | Do not add reference repositories as unreviewed submodules, vendored code, runtime dependencies, or hidden services. | P0 | Dependency and source-tree audit. |
| REF-05 | Update `THIRD-PARTY-NOTICES.md` whenever an external implementation is adopted. | P1 | Notice diff included in the same PR. |
| REF-06 | Separate design inspiration from tested product behavior in README, architecture, compliance, and demos. | P1 | Claims review and traceability update. |

## 16. Correctness and repository hygiene checks to perform every change

1. Run `pnpm install --frozen-lockfile` and review the lockfile diff.
2. Run `pnpm audit --audit-level=moderate`; investigate every new advisory and document any accepted exception.
3. Run `pnpm validate:references`.
4. Run `pnpm lint`, `pnpm test`, `pnpm run test:coverage`, and `pnpm build`.
5. Run contract-specific static analysis and fuzzing when Solidity changes.
6. Run API/indexer/frontend/storage tests when those components are added; do not let conditional CI logic hide an absent suite.
7. Validate every workflow YAML, JSON configuration file, Dockerfile, environment schema, and deployment manifest.
8. Verify every action, container, package, compiler, and external tool is pinned or governed by a documented update policy.
9. Run secret scanning against the working tree, staged diff, Git history, artifacts, logs, and test fixtures.
10. Run `git diff --check`, inspect the staged patch, and verify no generated build output or credentials are accidentally tracked.
11. Confirm documentation, ADRs, threat model, acceptance criteria, traceability, changelog, third-party notices, and release notes match the code.
12. Ensure the PR states deployment context: prototype-only, testnet-ready, pilot, or production gate.

## 17. Release gates

### Gate A — Current local MVP

The contract must compile reproducibly, all unit/negative/property tests must pass, the local deployment must be disposable, and the README/compliance documents must state that no production readiness or audit is claimed.

### Gate B — Controlled testnet

Before any testnet deployment, complete the DID/identity decision, contract independent review, stronger invariants, deployment manifest, multisig or approved signer custody, event schema, verifier, basic indexer, transaction-status handling, monitoring, pause runbook, and sanitized demonstration.

### Gate C — Organizational pilot

Before a pilot, complete API authentication/authorization, indexer reorg/reconciliation, encrypted storage/key wrapping, backup/restore, offboarding/recovery, physical-asset verification, client accessibility, incident response, support ownership, privacy/legal review, bounded tenancy, and operator training.

### Gate D — Production

Before production, complete independent contract and application penetration testing, KMS/HSM and multi-party custody, network/validator governance, HA/failover, RTO/RPO drills, SBOM/provenance, release/rollback policy, real security contacts, privacy/records/legal approval, formal risk acceptance, independent verification, and a signed production go/no-go decision.

> **No-go conditions:** Do not use real identity data, live organizational assets, production private keys, or an unapproved public/permissioned network while any P0 gate is open. Do not describe the repository as production-grade, audited, legally dispositive, or BEL-endorsed without evidence.

## 18. Recommended execution order

| Sequence | Work package | Primary owners | Exit condition |
|---:|---|---|---|
| 1 | External governance: OpenSSF registration, independent reviewer recruitment, CODEOWNERS teams, branch-policy verification, real security contact | Maintainer, security lead, organization owner | External actions complete or explicitly tracked with accountable owners. |
| 2 | Contract assurance: DID method, role graph, admin custody, asset lifecycle, event schema, independent review, Slither, stateful fuzzing | Contract reviewer, security lead | Contract review report closed and test evidence published. |
| 3 | Configuration truth: environment schema, Dependabot/devcontainer/PR-template corrections, CI component matrix, release controls | Maintainer, DevOps | Clean checkout instructions work without hidden failures. |
| 4 | API/indexer foundation: authentication, authorization, transaction state, event ingestion, confirmations, reorgs, reconciliation | Backend/indexer lead | End-to-end canonical-state workflow passes failure tests. |
| 5 | Encryption/storage: envelope encryption, KMS/HSM, storage availability, key release/revocation, retention | Security lead, platform lead, privacy owner | Key lifecycle and restore/revocation drills pass. |
| 6 | Web/mobile client: wallet safety, transaction preview, permission views, accessibility, E2E | Frontend/mobile lead, accessibility reviewer | Critical flows pass E2E and manual accessibility review. |
| 7 | Testnet operations: approved network, deployment manifest, verified artifacts, monitoring, pause, incident, rollback | Release manager, network operator | Signed testnet go/no-go package. |
| 8 | Pilot and production assurance: privacy/legal, physical asset verifier, pen test, audit, DR, training, support, risk acceptance | Organization owner and all domain leads | Signed pilot/production decision with linked evidence. |

## 19. Definition of done for this register

An item is complete only when its implementation exists, tests cover both success and rejection/failure paths, documentation and configuration are synchronized, operational ownership is assigned, and evidence is linked from a reviewed pull request, release artifact, runbook, audit report, or approved governance record. A passing CI workflow alone is insufficient for identity assurance, legal title, privacy, cryptographic custody, independent contract security, or production readiness.

## References

[1]: https://github.com/ossf/scorecard/blob/main/docs/checks.md "OpenSSF Scorecard checks and remediation guidance"
[2]: https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql "GitHub CodeQL code scanning documentation"
[3]: https://www.bestpractices.dev/en "OpenSSF Best Practices Badge program"
[4]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
[5]: https://eips.ethereum.org/EIPS/eip-4361 "EIP-4361: Sign-In with Ethereum"
[6]: https://eips.ethereum.org/EIPS/eip-721 "EIP-721: Non-Fungible Token Standard"
[7]: https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final "NIST SP 800-57 Part 1: Recommendation for Key Management"
[8]: https://csrc.nist.gov/publications/detail/sp/800-38d/final "NIST SP 800-38D: Recommendation for Galois/Counter Mode"
[9]: https://www.w3.org/TR/WCAG22/ "W3C Web Content Accessibility Guidelines (WCAG) 2.2"
[10]: https://slsa.dev/spec/v1.2/build-requirements "SLSA build requirements and provenance"
[11]: https://ipfs.tech/ "IPFS project and documentation"
[12]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"

## Repository evidence index

- [`README.md`](../README.md) — product scope, claims, stack, references, and MVP boundaries.
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — components, trust boundaries, data placement, indexing, recovery, and open decisions.
- [`docs/COMPLIANCE-REPORT.md`](COMPLIANCE-REPORT.md) — Problem Statement 26125 alignment and production gates.
- [`docs/PROBLEM-STATEMENT-TRACEABILITY.md`](PROBLEM-STATEMENT-TRACEABILITY.md) — requirement-level completion evidence.
- [`docs/ACCEPTANCE-CRITERIA.md`](ACCEPTANCE-CRITERIA.md) — MVP demonstration and evidence criteria.
- [`docs/THREAT-MODEL.md`](THREAT-MODEL.md) — abuse cases, invariants, and residual risks.
- [`docs/ENCRYPTION-KEY-MANAGEMENT.md`](ENCRYPTION-KEY-MANAGEMENT.md) — encryption and key-lifecycle boundary.
- [`docs/SECURITY-SCANNING-STATUS.md`](SECURITY-SCANNING-STATUS.md) — Code Scanning and Scorecard status.
- [`MAINTENANCE.md`](../MAINTENANCE.md) — maintenance cadence and ongoing evidence.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution, testing, and review expectations.
- [`SECURITY.md`](../SECURITY.md) — reporting, severity, and MVP security boundaries.
- [`GOVERNANCE.md`](../GOVERNANCE.md) — decision, review, release, and emergency governance.
- [`ROADMAP.md`](../ROADMAP.md) — staged implementation horizons and explicit non-promises.
- [`THIRD-PARTY-NOTICES.md`](../THIRD-PARTY-NOTICES.md) — curated repository attribution and adoption boundaries.
