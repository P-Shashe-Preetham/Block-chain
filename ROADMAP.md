# Roadmap

This roadmap describes a staged path from documentation baseline to a controlled prototype and, only after evidence and approvals, toward a production-ready deployment. Dates are intentionally expressed as horizons rather than commitments until maintainers, resources, target network, and compliance requirements are confirmed.

## Current status

The project is at the **prototype/MVP documentation stage**. The repository defines default boundaries and governance but does not claim deployed contracts, a completed security audit, verified institutional ownership, or production authorization.

## Milestones

| Horizon | Milestone | Outcome | Exit evidence |
|---|---|---|---|
| Sprint 0 | Repository foundation | Tooling, ownership, policies, environment, and CI baseline | Clean checkout, documented commands, passing static checks |
| Sprints 1–2 | Contract domain model | DID references, roles, permissions, NFT lifecycle, events, and emergency controls | Unit tests for authorized and rejected state transitions; reviewed ABI and event schema |
| Sprints 2–3 | API and indexer baseline | Read models, event ingestion, reconciliation, and safe API authorization | Idempotent indexing tests, API contract tests, and documented failure handling |
| Sprints 3–4 | Web console | Identity, role, asset, allocation, verification, and audit views | End-to-end tests, keyboard review, accessibility baseline, and permission-aware UI |
| Sprints 4–5 | Security and privacy hardening | Threat model, data classification, key-management design, and abuse-case mitigations | Security review sign-off, privacy review inputs, and remediation tracker |
| Testnet horizon | Controlled deployment | Approved testnet deployment and operator runbooks | Reproducible deployment, contract verification, monitoring, rollback, and incident drill |
| Pilot horizon | Organizational pilot | Bounded users, assets, roles, and support process | Pilot acceptance criteria, audit evidence, recovery test, and owner approval |
| Production gate | Production readiness | Formal operational, legal, security, and governance approval | Independent contract review, approved network and custody, data controls, and release decision |

## Workstreams

### Identity and trust

Select the DID method or enterprise identity integration, define verification assurance levels, document key rotation and revocation, and decide how credentials are issued, presented, and invalidated. No identity method should be treated as equivalent to real-world identity without an approved verification process.

### Smart contracts

Implement the smallest auditable contract surface. Prefer explicit roles, constrained minting, safe transfer rules, event completeness, pause or emergency procedures, and carefully documented upgradeability. Add property-based or fuzz testing when the contract model stabilizes. Obtain independent review before any deployment that holds value or controls organizational access.

### Asset governance

Define what constitutes an asset, who may create it, how metadata is approved, how ownership is transferred, how loss or compromise is handled, and whether physical assets require an external custody record. Document the difference between token ownership, legal ownership, possession, and operational access.

### Indexing and reconciliation

Build an idempotent event consumer that waits for the approved confirmation policy, handles retries and chain reorganizations, and periodically reconciles off-chain projections with canonical contract state. Alert on projection drift and missing events.

### Operations and assurance

Define deployment keys, multi-party approvals, backups, monitoring, alert ownership, disaster recovery, incident response, and release rollback. Add data-retention and access-review procedures before the platform handles real identity or regulated asset data.

## Explicitly not promised yet

The roadmap does not promise a public mainnet deployment, a specific blockchain vendor, legal recognition of token ownership, privacy compliance, institutional endorsement, or an independent security audit. Each must be a separately approved decision with evidence.

## Review cadence

Maintainers should review this roadmap at least once per milestone and whenever the target audience, network, identity assurance, or deployment stage changes. Completed work should link to issues, pull requests, release notes, and ADRs rather than being marked complete solely by narrative.
