# GitHub Copilot instructions

This repository is an MVP platform for decentralized identity references, smart-contract-enforced RBAC, NFT-backed digital-asset ownership, and immutable event auditing. Generate code that is secure, explicit, testable, and consistent with `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, and `docs/ADR/0001-initial-tech-stack.md`.

## Security and privacy

Treat the frontend, API client, database projection, wallet address, role label, token metadata, DID reference, and cached state as untrusted until validated by the approved policy and canonical contract state. Enforce authorization in contracts and backend services. Fail closed on revoked identities, unknown roles, stale projections, malformed requests, and unavailable authorization data. Do not use `tx.origin` for authorization or create hidden admin paths.

Never generate or request private keys, seed phrases, credentials, real identity documents, biometric data, or sensitive personal data. Use clearly synthetic test fixtures and safe placeholders. Do not log secrets, authorization headers, raw identity payloads, or unnecessary personal data. Do not place sensitive identity information in public token metadata or on-chain events.

## Contract guidance

Use Solidity and OpenZeppelin primitives unless an ADR says otherwise. Write tests for authorization boundaries, reentrancy where applicable, duplicate or replayed operations, invalid state transitions, event payloads, pause or emergency behavior, upgradeability assumptions, and ownership-transfer policy. Document public methods, roles, events, and deployment configuration. Never represent token ownership as legal title without an approved policy.

## Service guidance

Use FastAPI, Pydantic, and Web3.py with explicit schemas and service boundaries. Authenticate and authorize each state-changing route. Verify chain ID, contract address, transaction result, confirmation policy, and expected events before reporting success. Make indexer writes idempotent, handle retries and reorganization risk, and provide reconciliation evidence. Treat PostgreSQL and object storage as recoverable off-chain projections.

## Frontend guidance

Use Next.js, React, and TypeScript. Keep permission-aware rendering consistent with server and contract authorization. Provide transaction previews, pending/failed states, safe error messages, visible focus, keyboard operation, semantic labels, and accessible validation. Add Cypress and axe-core coverage for critical workflows where practical.

## Change workflow

Make the smallest coherent change. Read nearby tests and ADRs first. Update documentation, environment templates, events, migrations, and runbooks when interfaces or operational assumptions change. Use Conventional Commits. Before presenting a solution, list files changed, commands run, test results, security/privacy impact, and known limitations. If the target behavior is ambiguous, state an assumption or ask for clarification instead of inventing a privileged or irreversible policy.
