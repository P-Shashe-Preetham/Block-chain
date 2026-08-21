# ADR 0001: Initial Technology Stack

- **Status:** Accepted for prototype/MVP documentation baseline
- **Date:** 2026-08-21
- **Decision owners:** Maintainers, technical lead, security lead, and contract reviewer
- **Review trigger:** Before testnet deployment, when a stack component becomes operationally critical, or when the target organization approves a different platform standard

## Context

The platform must connect decentralized identity references, smart-contract-enforced roles, NFT-backed digital-asset ownership, an API, a searchable audit projection, and an accessible operator console. The repository is new, so the initial stack must support local development, deterministic tests, explicit authorization, clear deployment boundaries, and a migration path to organization-approved infrastructure.

The project serves a security-sensitive domain. The stack therefore must not encourage placing personal data or secrets on-chain, relying on UI-only permissions, using a single unmanaged deployment key, or treating an off-chain database as the canonical ownership record. The technology decision must also be understandable to contributors and maintainable by teams that may standardize on a different cloud, chain, or language later.

## Decision

Adopt the following defaults for the MVP:

| Area | Decision | Reason |
|---|---|---|
| Smart contracts | Solidity with Hardhat and OpenZeppelin Contracts | Broad EVM tooling, typed integration options, reusable access-control and token primitives, and local testing support |
| Local chain | Hardhat Network, with an approved EVM testnet path later | Fast disposable development and deterministic tests before network governance is selected |
| Token model | ERC-721-compatible NFT behavior unless a domain review selects another standard | Represents unique digital assets while preserving a familiar verification model |
| Identity | DID reference plus explicit application verification and lifecycle state | Avoids assuming that a wallet address alone proves organizational identity; leaves DID method selection open |
| Backend | Python 3.11, FastAPI, Pydantic, and Web3.py | Clear request validation, readable service boundaries, and accessible Python testing/tooling |
| Persistence | PostgreSQL for off-chain projections and workflow records | Strong relational querying and operational familiarity; not canonical ownership storage |
| Indexing | Dedicated event-consumer service with idempotent writes and reconciliation | Makes chain events searchable while preserving replay and drift detection |
| Frontend | Next.js, React, and TypeScript | Type-safe operator console, component composition, and deployment flexibility |
| UI foundation | shadcn/ui or accessible internal primitives | Supports consistent, keyboard-operable interfaces without hiding authorization logic |
| Jobs | Redis and BullMQ as an optional prototype queue | Supports retries for indexing and non-critical work; replaceable when durability requirements grow |
| Object storage | S3-compatible encrypted storage, MinIO locally | Keeps large or sensitive permitted metadata off-chain and makes local development reproducible |
| Quality | Hardhat tests, pytest, Cypress, and axe-core baseline checks | Covers contract, API, browser, and accessibility paths |
| Delivery | Docker Compose locally and GitHub Actions for CI/security workflows | Reproducible dependencies and repository-native automation |

## Why this combination

The stack separates consensus and authorization from application convenience. Solidity contracts establish the rules for roles and asset state, while FastAPI and PostgreSQL make those rules queryable and usable without pretending to supersede the chain. Next.js and TypeScript provide a type-aware operator surface, while Python services keep identity and indexing workflows easy to test and inspect. Hardhat enables a low-friction local network, and OpenZeppelin supplies commonly used contract building blocks that still require project-specific review.[1] [2]

The defaults also preserve replaceability. A permissioned EVM network can replace the selected testnet path, a Python-native database layer can replace Prisma if the project remains Python-first, and a durable workflow engine can replace BullMQ when retries and operational guarantees become business-critical. The architecture records these choices as defaults rather than irreversible commitments.

## Alternatives considered

### Foundry instead of Hardhat

Foundry offers fast Solidity-native compilation and testing and may become preferable for fuzzing-heavy contract development. Hardhat remains the initial default because the surrounding MVP is expected to include TypeScript integration, deployment scripts, and a mixed-language contributor base. The project may adopt Foundry or use both tools after measuring test speed, reviewability, and CI complexity.

### Enterprise PKI or verifiable credentials instead of DID references

An enterprise PKI or a verifiable-credential system may provide stronger organizational assurance, lifecycle controls, and interoperability with existing systems. The initial platform documents a DID reference so the application does not hard-code a centralized identity provider, but it must select and document a concrete assurance model before handling real identities.

### Permissioned EVM network instead of a public chain

A permissioned EVM network may better support data governance, predictable fees, organizational control, and network privacy. A public or public-testnet path may improve independent verifiability and ecosystem interoperability. The decision depends on data classification, finality, operational ownership, legal review, and institutional policy; no production network is selected by this ADR.

### Python-native ORM instead of Prisma

Prisma has strong TypeScript tooling but is not a natural default for a Python-first backend. A Python-native option such as SQLAlchemy with Alembic may be more coherent if the indexer and API remain in Python. The MVP documentation permits either a TypeScript indexing boundary with Prisma or a Python-native persistence implementation; the implementation repository must choose one and update this ADR before schema migrations land.

### Managed indexer instead of a repository-owned indexer

A managed blockchain indexer can reduce operational work but introduces vendor dependency, data residency questions, and a second trust boundary. The repository-owned indexer is selected for MVP transparency and replayability. A managed indexer may be evaluated after measuring chain coverage, reorganization handling, latency, and audit requirements.

## Consequences

### Positive consequences

The system has a clear trust model, local-first development path, explicit tests for authorization, and replaceable off-chain services. A contributor can inspect contract state independently of the UI. The architecture supports audit exports, indexing replay, and a gradual path from prototype to controlled testnet deployment.

### Negative consequences

The platform is operationally more complex than a centralized CRUD application. Contributors must understand wallet signing, chain confirmations, event indexing, reorganization risk, key custody, and privacy limitations. The split between Python and TypeScript introduces tooling and type-boundary overhead. NFT semantics do not automatically establish legal title or real-world identity, so product language and governance must remain precise.

### Security consequences

Contract and application authorization must be tested independently. The API cannot trust client-provided roles, and the UI cannot be treated as a security boundary. Privileged deployment and minting keys require stronger controls than local development accounts. Public events and token metadata must be reviewed for data leakage. No production deployment is permitted based on this ADR alone.

### Operational consequences

The indexer must be idempotent, observable, and able to replay from a known block. PostgreSQL and object storage require backups and access review. The queue requires retry and dead-letter behavior. CI must pin or constrain dependencies and should include supply-chain checks. Changes to contracts, event schemas, or environment variables may require coordinated migrations and release notes.

## Revisit criteria

Revisit this ADR when any of the following occurs:

- The target organization selects an approved chain, cloud, identity provider, or language standard.
- A production or pilot deployment requires stronger privacy, finality, availability, or data-residency guarantees.
- Contract upgradeability, custody, or multi-party approval becomes necessary.
- The project adopts a different NFT standard, DID method, credential format, or tenancy model.
- The Python/TypeScript database boundary creates material operational cost.
- Security review, threat modeling, or a dependency audit identifies a stack-level risk.

## References

[1]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[2]: https://hardhat.org/docs "Hardhat documentation"
[3]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
[4]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[5]: https://fastapi.tiangolo.com/ "FastAPI documentation"
