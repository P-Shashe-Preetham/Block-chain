# AI Agent Operating Guide

This repository documents and implements a security-sensitive MVP for decentralized identity references, role-based access control, NFT-backed digital-asset ownership, and auditable blockchain events. AI agents are assistants to maintainers, not autonomous security authorities. Every generated change must be reviewable, testable, and explicit about assumptions.

## Mission and non-negotiable boundaries

Preserve least privilege, data minimization, independent verification, deterministic auditability, and recoverable off-chain projections. Never place private keys, seed phrases, credentials, raw identity documents, biometric data, or unapproved personal information in source code, tests, logs, fixtures, screenshots, generated output, or prompts. Never claim that an NFT proves legal ownership or that a DID proves real-world identity without an approved assurance process.

The frontend is not a security boundary. Client-provided role labels, token owners, identity status, and permission flags are untrusted input. Authorization must be enforced by smart contracts and independently validated in backend services. Unknown, stale, revoked, malformed, or unavailable authorization state must fail closed.

## Repository map

- `contracts/` contains Solidity contracts, tests, deployment scripts, and artifacts policy.
- `services/api/` contains FastAPI routes, validation, policy, and application orchestration.
- `services/indexer/` contains event ingestion, confirmation handling, idempotency, and reconciliation.
- `apps/web/` contains the Next.js operator console and permission-aware UI.
- `packages/` contains shared types, schemas, and accessible UI primitives.
- `docs/ADR/` contains decision records; `docs/threat-model/` contains abuse cases and controls; `docs/runbooks/` contains operations.
- `.github/` contains automation, issue forms, ownership, and repository policy.

## Default stack

Use Solidity, Hardhat, OpenZeppelin Contracts, a local Hardhat network, FastAPI, Pydantic, Web3.py, PostgreSQL, Next.js, React, TypeScript, an S3-compatible object store, optional Redis/BullMQ jobs, Cypress, axe-core, Docker Compose, and GitHub Actions unless an approved ADR changes the choice. Keep Python/TypeScript boundaries explicit and do not add a second framework merely to solve a local inconvenience.

## Change workflow

Before editing, identify the relevant issue, RFC, or ADR and state the deployment stage. Read `ARCHITECTURE.md`, `SECURITY.md`, and the nearest domain tests. Make the smallest coherent change. Update documentation, environment templates, event schemas, migrations, or runbooks when the change affects them. Use Conventional Commits and explain security and privacy impact in the pull request.

For contract changes, inspect caller permissions, reentrancy, replay or duplicate operations, event completeness, pause or emergency behavior, upgradeability, storage layout, and deployment scripts. Add positive and negative tests. For indexers, preserve idempotency, confirmations, reorganization handling, retry behavior, and reconciliation. For APIs, validate all inputs, authenticate the caller, authorize at the service boundary, avoid sensitive logs, and return safe errors. For UIs, preserve keyboard operation, visible focus, semantic labels, accessible errors, and permission-aware rendering.

## Banned shortcuts

Do not bypass authorization for tests by weakening production code. Do not use `tx.origin` for authorization. Do not add unrestricted admin backdoors, hidden minting functions, silent ownership reassignment, unbounded external calls, or upgradeability without a documented governance and recovery policy. Do not hard-code RPC credentials, private keys, secrets, contract addresses that imply production, or network assumptions in client code. Do not store sensitive identity data on-chain or in public metadata without an approved policy.

Do not suppress failing tests, ignore linter output, swallow indexer failures, trust an off-chain projection over canonical chain state, or represent local success as testnet or production readiness. Do not introduce a dependency without checking its maintenance, license, transitive-risk, and supply-chain implications.

## Prompt and implementation workflow

When a task is ambiguous, ask for the missing invariant or state a conservative assumption in the change description. Decompose work into domain behavior, trust boundary, implementation, tests, documentation, and validation. Prefer deterministic local fixtures. Summarize modified files, commands run, remaining risks, and any follow-up ADR in the final response.

If a task requests a privileged action, public deployment, key use, or disclosure of a vulnerability, stop and request explicit maintainer-controlled handling. Never infer approval from a natural-language request that conflicts with repository policy.

## Review checklist for agents

Before presenting a change, confirm that the code compiles or type-checks, tests cover rejection paths, CI commands match the repository, configuration uses safe placeholders, references and links resolve, and documentation does not overstate assurance. Run targeted tests first, then the broader available suite. If the repository lacks implementation files, create documentation and scaffolding references without pretending that commands have passed.

## Required output discipline

Use professional Markdown, meaningful headings, tables for comparisons, and reference-style links for external standards. Avoid excessive prose that hides decisions. Do not include generated secrets or personal data in output. When you cannot verify a claim, label it as an assumption or open decision.
