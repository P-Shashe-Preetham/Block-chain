# ADR 0005: Final-project scope and maturity gates

- **Status:** Accepted for final-project execution; testnet, pilot, and production approvals remain open
- **Date:** 2026-08-23
- **Decision owners:** Maintainers, contract/security lead, identity lead, backend/data lead, storage/key lead, frontend/accessibility lead, infrastructure lead, privacy/legal owner, and release owner
- **Review trigger:** Before controlled-testnet deployment, before adding real identity or organizational asset data, before enabling any optional subsystem as a runtime dependency, or when the evaluation scope changes

## Context

The repository has progressed beyond a contract-only MVP: it contains a canonical Solidity contract, tested fail-closed API/indexer/storage/persistence boundaries, durable projection references, a strict generated-ABI decoder, and a complete remediation register. The final project requires an integrated demonstration, but it must not be represented as production-ready solely because code, documentation, or CI exists.

The supplied reference set includes identity, NFT, storage, permissioned-ledger, full-stack, infrastructure, testing, design, AI, ML, and agent sources. Treating all of them as runtime dependencies would increase attack surface, licensing risk, operational complexity, and architectural drift. The project instead needs an evidence-based adoption model in which every source receives a concrete design, testing, training, operational, comparison, or explicit non-adoption use.

## Decision

The target deliverable is a **submission-ready final project plus a controlled-testnet path**. The project will demonstrate sanitized identity, role, asset, access, transaction, indexing, storage, verification, and audit workflows. It will use the canonical contract as the authority for contract-owned facts and treat API, database, indexer, queue, storage, UI, AI, and analytics as projections or coordination layers.

Maturity labels are mandatory:

| Label | Meaning | Minimum evidence |
|---|---|---|
| `submission-ready-final-project` | Integrated evaluation demonstration with sanitized data and reproducible local or approved evaluation infrastructure | End-to-end demo, reproducible build, traceability, security gates, known limitations, and reviewer sign-off |
| `controlled-testnet` | Demonstration on an approved non-production network with controlled identities and custody | Network/finality decision, signer custody, contract review, deployment manifest, monitoring, runbooks, sanitized data |
| `pilot` | Bounded organizational use with approved operators/assets and operational ownership | Identity, privacy/legal, storage/KMS, tenancy, recovery, accessibility, support, DR, and incident evidence |
| `production` | Live operational service | Independent assurance, HA/DR, governance, legal/privacy/records approval, custody, support, risk acceptance, signed go/no-go |

The default implementation stack remains Solidity/Hardhat/OpenZeppelin, FastAPI, PostgreSQL/SQLAlchemy/Alembic, a read-only EVM indexer, encrypted storage behind KMS/HSM policy, and a Next.js/React/TypeScript client. Prisma, a TypeScript backend, another contract stack, a marketplace, auctions, payments, mobile, desktop, AI, ML, search, realtime, CMS, or enterprise streaming may be evaluated but is not automatically part of the core release.

## Reference adoption policy

Every supplied source is recorded in `docs/reference-ledger.md` with URL, category, decision, concrete use, evidence gate, provenance status, consulted revision/date, owner, and maintenance condition. The existing original 15-source catalog and integration matrix remain authoritative for those sources. Only OpenZeppelin is currently a runtime dependency from the original 15. A deeper adoption requires a focused ADR or design record, exact version/commit, license/provenance review, threat-model update, tests, dependency/source-tree review, and third-party-notice update.

Reference-only, research, agent, scraper, and design sources cannot grant production signing, merge, deployment, authorization, key-release, privacy, or legal authority. Situational sources are activated only after a demonstrated requirement, benchmark, failure test, license review, operational owner, and removal path.

## Consequences

The final project can use the full reference set without falsely claiming that every project is integrated runtime code. The evidence package becomes richer because each reference maps to a design decision, test, training exercise, or rejected alternative. The project will carry more documentation and review work, but that work prevents license, supply-chain, architectural, and claim drift.

The final-project label does not close the external gates for identity-provider approval, network governance, KMS/HSM custody, independent audit, privacy/legal approval, real contacts, eligible non-author review, or OpenSSF registration. These remain visible blockers.

## Required evidence before final-project release

The release must include the final-project plan, complete reference ledger, problem-statement traceability, architecture, threat model, data dictionary, contract ABI/manifest, API/OpenAPI, indexer/reconciliation evidence, storage/key boundary, web/E2E/accessibility evidence, independent verifier, SBOM/provenance, known limitations, risk register, and reviewer/go-no-go record. No real identity data, organizational asset data, production secrets, private keys, or unapproved BEL data may be used.

## References

[1]: ../FINAL-PROJECT-COMPLETION-PLAN.md "Exhaustive final-project completion plan"
[2]: ../reference-ledger.md "Complete supplied-source utilization ledger"
[3]: ../../ARCHITECTURE.md "Canonical ledger and recoverable projection architecture"
[4]: ../COMPREHENSIVE-IMPROVEMENT-AND-FIX-REGISTER.md "Evidence-gated remediation register"
