# Final Project Decision Register

## Decision status vocabulary

| Status | Meaning |
|---|---|
| `accepted` | A repository-controlled technical direction is selected and may be implemented within its documented boundary. |
| `blocked-external` | A decision needs evidence or approval from an identity, custody, legal, privacy, security, network, or organizational authority. Code must retain its fail-closed boundary. |
| `future-gated` | A capability is optional and can be activated only after its requirement, ADR, compatibility review, threat model, failure test, and removal plan exist. |
| `comparison-only` | A source contributes design, test, or evaluation value but is not an executable dependency or hosted service. |

## Accepted repository-controlled decisions

| ID | Decision | Status | Rationale and boundary | Required follow-through |
|---|---|---|---|---|
| DEC-01 | Contract-owned facts remain canonical. | `accepted` | The contract is the authority for identity-reference lifecycle, roles, ownership, asset lifecycle, access decisions, and pause state. Derived components cannot silently override it. | Contract/API/indexer/UI tests must continue to prove stale or unknown derived state fails closed. |
| DEC-02 | FastAPI with SQLAlchemy/Alembic and PostgreSQL remains the backend/persistence direction. | `accepted` | It matches the implemented boundary and avoids a second ORM/backend authority. Prisma remains a comparison input. | Complete tenant, migration, restore, concurrency, and durable service evidence. |
| DEC-03 | The final web console will be a feature-oriented React/TypeScript application built with Vite and a separate FastAPI API boundary. | `accepted` | The existing Evidence Ledger prototype is a Vite/React console; the repository already selects FastAPI rather than a TypeScript application server. This keeps browser and server authority separate and avoids introducing a second full-stack backend. | Add `apps/web/` only with project-owned components, accessibility, i18n, query/form state, E2E, and typed API client checks. |
| DEC-04 | The final release target is `submission-ready-final-project`, not a testnet, pilot, or production claim. | `accepted` | This target permits a complete sanitized evaluation workflow while outstanding external decisions remain visible and disabled. | Final Release Gate evidence, known limitations, and honest maturity label. |
| DEC-05 | The independent verifier derives results from configured chain, ABI, token, and commitment inputs rather than cached UI or database state. | `accepted` | It reinforces recoverable projections and permits audit without trusting an operational dashboard. | Publish verifier specification, fixtures, CLI/page implementation, and independence tests. |
| DEC-06 | Original 15 and expanded sources use traceable maximum value, not indiscriminate runtime integration. | `accepted` | Every source must influence a pattern, test, comparison, training asset, operational control, or explicit non-adoption record. | Maintain the reference ledger, notices, adoption protocol, and validator. |

## Decisions blocked pending actual external evidence

| ID | Decision required | Status | Why code may not decide it | Safe current behavior |
|---|---|---|---|---|
| EXT-01 | OIDC/PKI provider or DID/VC method, assurance mapping, and organizational trust registry | `blocked-external` | It defines real-world identity assurance, privacy purpose, key rotation, offboarding, recovery, and support responsibility. | Authentication rejects unverified tokens; local test doubles remain non-production. |
| EXT-02 | EVM network, finality policy, RPC/provider set, deployer custody, and multisig/emergency model | `blocked-external` | It determines irreversible deployment and asset authority. | Deployment policy permits only disposable local/CI environments. |
| EXT-03 | KMS/HSM, object-storage or IPFS strategy, residency, retention, legal hold, erasure, and recovery owner | `blocked-external` | It controls data custody, key release, and privacy/records obligations. | Local crypto/classification/key-release references remain synthetic and fail closed. |
| EXT-04 | Privacy, legal title, recordkeeping, incident/support contacts, and organizational CODEOWNERS | `blocked-external` | These are organizational responsibilities that code cannot create. | Documentation retains explicit limitations and placeholder-free blocker records. |
| EXT-05 | Eligible non-author reviewer and independent assurance | `blocked-external` | Protected review and audit must be legitimate human activities. | Branch remains review-pending; no bypass or invented approval is used. |

## Future-gated component decisions

| ID | Capability | Status | Activation trigger |
|---|---|---|---|
| OPT-01 | Redis and one queue implementation | `future-gated` | Worker requirements exceed transaction-scoped scanning and have queue idempotency, retry, dead-letter, TTL, outage, tenant, and non-authority tests. |
| OPT-02 | Search, realtime, event streaming, gateway, CMS | `future-gated` | A measured user/operational requirement survives a benchmark, ADR, threat model, license review, and removal-path test. |
| OPT-03 | AI, ML, analytics, ETL | `future-gated` | Sanitized data, privacy/retention policy, human review, evaluation, and explicit no-authority controls exist. |
| OPT-04 | Mobile, desktop, payments, marketplace, auctions | `future-gated` | A final-project scenario requires it and legal/custody/security implications are approved. |

## Required decision review cadence

The repository must revisit `blocked-external` rows before testnet, pilot, or any real-data integration. Every accepted or activated decision needs an ADR update, source-ledger reference, test plan, threat-model delta, release-gate impact, and a named accountable human role. Unknown status is never approval.
