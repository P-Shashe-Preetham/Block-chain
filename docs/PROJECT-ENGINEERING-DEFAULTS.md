# Project Engineering Defaults and Compatibility Decisions

## Purpose

This document records how the supplied development-default guidance is applied to this repository. It makes selection policy visible in the repository rather than treating it as an implicit agent preference. Existing security boundaries in [`CLAUDE.md`](../CLAUDE.md), ADR 0004, ADR 0006, ADR 0007, and ADR 0008 override any general external recommendation.

## Universal engineering defaults

| Need | Default application | Evidence required before use |
|---|---|---|
| Git practice | Use protected branches, conventional commits, small reviewable changes, rebase/recovery guidance, and release evidence. | Commit history, PR template, review record, release checklist. |
| Licensing | Preserve MIT for project-owned work and record external license/provenance before adoption. | Third-party notice update and compatibility review. |
| Governance | Use contribution, issue, and review practices as process references. | Maintainer documentation and legitimate reviewer availability. |
| Automation | Consider n8n only for isolated, low-risk notification/reporting workflows. | License, patching, threat-model, isolation, and no-authority decision. |
| Project tracking | Use an issue/RACI/risk mapping before external project-board integration. | Issue identifiers or explicit external-action blocker state. |

## Final stack compatibility matrix

| Supplied default | Repository decision | Rationale and guardrail |
|---|---|---|
| FastAPI full-stack reference | **Adopt patterns, retain FastAPI** | The repository already contains a Python service boundary and SQLAlchemy/Alembic direction. Use the reference for structure, Compose, tests, and deployment comparison without replacing the existing implementation wholesale. |
| create-t3-app / create-t3-turbo | **Comparison only** | A TypeScript full-stack or monorepo is not introduced until a real second client or shared-package requirement survives ADR review. |
| Bulletproof React and shadcn/ui | **Adopt project-owned patterns** | Use feature-oriented client structure and source-owned accessible components, with provenance and accessibility testing. |
| Ponytail | **Adopt a measured process pattern only** | Use the reuse-first/YAGNI ladder to remove unjustified dependencies or abstractions only after reading the actual flow and preserving validation, security, error handling, accessibility, and evidence. Do not install its plugins, copy instructions, or grant agent authority. |
| Prisma | **Comparison only** | SQLAlchemy/Alembic remains the selected persistence path. A second ORM would create diverging migrations and ownership. |
| Better Auth | **Capability comparison only** | Approved OIDC/PKI or DID/VC assurance controls identity. No framework is allowed to weaken issuer, signature, rotation, session, or offboarding requirements. |
| BullMQ / Redis | **Candidate, not current authority** | Add only after a queue ADR covers idempotency, TTL, tenant isolation, retry, dead-letter, outage, metrics, and non-authority constraints. |
| MinIO | **Local test candidate only** | It may support disposable S3-compatible integration testing, never a release image, until license/distribution and storage-owner decisions pass. |
| Cypress / axe-core | **Required testing patterns** | Critical browser flows require deterministic E2E plus automated and manual accessibility evidence. |
| Scalar | **Candidate API documentation interface** | Use only after an approved versioned OpenAPI surface is safe to publish. Standard OpenAPI remains primary. |
| OpenTofu | **Preferred IaC comparison** | Use for governed infrastructure only after a deployment target and state-security model are chosen. |
| Vercel AI, MLflow, Airflow, dbt, Umami | **Future-gated** | Optional components require a narrow need, data/privacy review, threat model, evaluation/failure tests, and removal plan. They cannot exercise authority. |
| Tauri, Electron, React Native, Flutter, Medusa, Lago | **Future-gated comparison** | No desktop, mobile, payments, or billing feature is added merely to consume a reference. |

## Activation checklist for every runtime candidate

1. Record the exact upstream revision/date, license, transitive dependencies, maintenance posture, and notice impact in the reference ledger.
2. Document why the existing stack cannot safely solve the requirement in a focused ADR.
3. Define authority, failure, data-classification, privacy, logging, tenant, and removal boundaries.
4. Add deterministic unit, integration, outage, and negative-path tests before enabling the component in a release profile.
5. Update the environment schema, lock files, CI, SBOM/provenance, runbooks, and evidence register.

## Explicitly prohibited shortcuts

No source default permits a second backend, second ORM, unapproved identity authority, queue-authorized access decision, browser-held secret, unreviewed vendor service, GPL/AGPL distribution decision, public testnet deployment, fabricated provider, or production claim.
