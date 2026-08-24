# MIG-2026-001: Repository-Native Evidence Ledger Console

## 1. Change identification

| Field | Entry |
|---|---|
| Migration ID and title | `MIG-2026-001: Repository-Native Evidence Ledger Console` |
| Author and accountable roles | Repository contributor; frontend/accessibility, backend, security, and release roles require review. |
| Date and target release | 2026-08-23; submission-ready final-project local release sequence. |
| Change type | Client, API contract consumer, workspace/dependency, CI, and documentation. |
| Linked ADR/source ledger | ADR 0009; Bulletproof React, shadcn/UI guidance, TanStack Query, axe, i18n, and Vite entries remain source-ledger governed. |
| Maturity scope | Local/CI and submission-ready final project only. |

## 2. Canonical and data impact

This migration adds `apps/web/`, a Vite/React/TypeScript static client. It does **not** alter canonical contract state, ABI events, event version, database schema, storage envelope, identity verification, or deployment configuration. It reads only the existing sanitized `GET /v1/audit` response when the optional public `VITE_API_BASE_URL` build configuration is present.

The client does not receive raw logs, projection payloads, real identity data, keys, ciphertext, transaction intents, or browser-stored credentials. It has no wallet/signer, chain-submission, decryption, key-release, or authorization implementation. The browser UI is explicitly non-canonical and reports unavailable status when no API origin/authenticated response exists.

## 3. Compatibility and migration procedure

| Topic | Evidence |
|---|---|
| Forward migration | `pnpm install --frozen-lockfile`, then use `pnpm check:web`, `pnpm test:web`, and `pnpm build:web`. |
| Backfill/replay | Not applicable. The console has no local data or cache migration and does not create projections. |
| Compatibility window | Existing contract/API paths remain unchanged. The console depends only on the documented sanitized audit schema and fails closed on a missing/invalid response. |
| Rollback or forward-fix | Remove the `apps/web/` workspace and its CI steps; no canonical/state data migration is required. |
| Failure handling | Missing base URL, API failure, failed auth, or invalid schema renders an explicit unavailable/error state. No illustrative records substitute for live evidence. |
| Reconciliation | Not applicable to UI state. The independent verifier remains a separate pending feature and must not trust browser cache. |

## 4. Security, privacy, and operational review

The client uses a typed, bounded audit response parser, `credentials: "omit"`, no token input, no local/session storage, no analytics, and no signer dependencies. Its public API base URL is not a secret and must never be used to carry tokens or credentials. CI now runs web type checking, unit tests, and static build. Browser E2E, axe automation/manual accessibility, i18n, live approved identity/API configuration, CSP/hosting review, and independent verifier implementation remain release-gated.

## 5. Verification and release-gate evidence

| Verification | Command or artifact | Result |
|---|---|---|
| Unit tests | `pnpm test:web` | Pass: 3 audit-boundary tests. |
| Type check | `pnpm check:web` | Pass. |
| Static build | `pnpm build:web` | Pass. |
| Dependency audit | `pnpm audit --audit-level=low` | Pass: no known vulnerabilities after exact Vite/Vitest/esbuild remediation. |
| Local visual smoke check | Local Vite preview at `http://localhost:4300` | Pass: readable rail, headings, status filter, visible approval gates, explicit unconfigured audit state without illustrative records, and persistent rail navigation updates the active operational heading. |
| Source/reference and Markdown validation | `pnpm validate:references`; `pnpm validate:markdown` | Pass. |
| Contract, service, indexer, config, documentation, and whitespace gate | `pnpm test:config`, `pnpm lint`, `pnpm test`, `pnpm test:services`, `pnpm build`, `pnpm validate:indexer-abi`, `pnpm validate:references`, `pnpm validate:markdown`, and `git diff --check` | Pass in the combined locked service environment. |
| Browser E2E/axe/manual accessibility | No approved browser test stack or evidence yet. | Pending. |
| External/provider approval | Identity, API origin, network, custody, and hosting approvals. | Blocked external. |

## 6. Completion record

Status: **implemented and locally validated as a static, audit-only console**. This migration does not authorize live use or meet the final web/verifier release gate by itself. The release owner must rerun the full local gate after all remaining work, then obtain protected remote checks and legitimate non-author review before merge.
