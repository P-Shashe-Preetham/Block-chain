# Blockchain Secure Platform

[![CI](https://github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management/actions/workflows/ci.yml/badge.svg)](https://github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management/badge)](https://securityscorecards.dev/viewer/?uri=github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management)
[![OpenSSF Best Practices](https://img.shields.io/badge/OpenSSF%20Best%20Practices-assessment%20pending-lightgrey)](https://www.bestpractices.dev/en/projects/new)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Conventional Commits](https://img.shields.io/badge/commits-conventional-blue.svg)](https://www.conventionalcommits.org/)

**Blockchain Secure Platform** is an MVP reference architecture for decentralized identity, smart-contract-enforced role-based access control, and NFT-backed digital-asset ownership. It is designed for security-conscious organizations that need verifiable identity-to-asset relationships, controlled administrative workflows, and an immutable event trail without placing sensitive personal data directly on-chain.

The project is tailored to the **Blockchain & Cybersecurity** domain and is intended as a technical foundation for evaluation by **Bharat Electronics Limited**. It is not a production security certification, a legal opinion, or an endorsement by Bharat Electronics Limited. Production use requires a formal threat model, privacy review, key-management design, smart-contract audit, operational controls, and an approved deployment policy.

> **Core principle:** Put proofs, identifiers, hashes, roles, and state transitions on-chain; keep sensitive personal data and large files off-chain, encrypted, access-controlled, and governed by an explicit retention policy.

## What the platform provides

The platform connects four trust functions into one auditable workflow. A decentralized identifier (DID) represents an identity independently of a single application database. Smart contracts enforce administrator-controlled role assignment and permission checks. Digital assets are represented by unique non-fungible tokens (NFTs) whose ownership history can be independently verified. Contract events provide a tamper-evident history for identity, asset, allocation, transfer, and permission operations. DID terminology follows the W3C Decentralized Identifiers model, while NFT behavior is documented against the ERC-721 interface conventions.[1] [2]

The MVP deliberately separates **on-chain truth** from **off-chain application services**. A contract should not store raw identity documents, credentials, biometric data, secrets, or regulated personal information. Instead, permitted asset payloads are encrypted with an AES-256 data-encryption key before IPFS or approved object storage; the key is protected separately through controlled wrapping/access logic, with enterprise KMS/HSM integration reserved for production. The chain records only the minimum cryptographic references needed to verify integrity and authorization.

## Architecture at a glance

```mermaid
flowchart LR
    U[User / Administrator] --> W[Web Console\nNext.js + TypeScript]
    W --> V[Wallet / Identity Adapter]
    W --> API[FastAPI Application API]
    API --> AUTH[Identity & RBAC Service]
    API --> IDX[Indexer / Event Consumer]
    API --> OBJ[(Encrypted Object Storage)]
    API --> DB[(PostgreSQL\nOff-chain Read Model)]
    IDX --> DB
    IDX --> Q[Redis + BullMQ\nOptional Jobs]
    V --> RPC[EVM JSON-RPC]
    API --> RPC
    RPC --> SC[Smart Contracts\nDID Registry / RBAC / Asset NFT]
    SC --> BC[(EVM-Compatible Blockchain)]
    SC -. Events .-> IDX
    ADMIN[Key Management / Deployment Operator] --> SC
```

### Trust boundaries

The **wallet or identity adapter** signs user intent; it does not make an identity trustworthy by itself. The **FastAPI service** validates input and assembles application views but cannot rewrite blockchain history. The **smart-contract layer** is the authorization boundary for state-changing asset and role operations. The **database, job queue, and object store** are replaceable off-chain components and must be treated as recoverable projections, not as the source of ownership truth.

## Quickstart

### Prerequisites

Install the following before starting:

| Requirement | Recommended version | Purpose |
|---|---:|---|
| Git | 2.40+ | Source control |
| Node.js | 22 LTS | Hardhat contracts and Next.js frontend |
| pnpm | 11.21.0 | JavaScript workspace management |
| Python | 3.11+ | FastAPI service and tooling |
| Docker | 24+ | PostgreSQL, Redis, and MinIO local dependencies |
| Foundry or a compatible wallet | Current stable | Optional contract interaction and testnet workflows |

### Clone and configure

```bash
git clone https://github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management.git
cd Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management
cp .env.example .env
```

Review `.env` before running anything. Use local-only test accounts and throwaway keys for development. Never commit `.env`, private keys, seed phrases, production RPC credentials, or real identity data.

### Install and validate the current MVP

The current implementation is the Solidity/Hardhat contract MVP, a fail-closed FastAPI service boundary with transaction-state and authorization reference primitives, confirmed RPC/indexer projection primitives, AES-GCM envelope primitives, and PostgreSQL-oriented schema primitives. It does not yet include the full transaction API, durable database migrations/projections, managed key custody or storage adapter, or frontend. Do not start undocumented services or install dependencies from missing paths.

```bash
pnpm install --frozen-lockfile
python3 -m pip install --require-hashes --requirement services/api/requirements.lock
python3 -m pip install --require-hashes --requirement services/storage/requirements.lock
pnpm validate:environment -- --file .env.example --environment local
pnpm validate:references
pnpm validate:markdown
pnpm lint
pnpm test
pnpm run test:coverage
pnpm build
pnpm test:services
```

A disposable local deployment can be generated with `pnpm deploy:local`. The script permits only the local/CI chain policy, verifies chain ID and deployed bytecode, and writes a manifest. Validate the generated evidence with `pnpm validate:deployment-manifest -- --file deployments/local.json`. Non-local environments remain blocked until an approved network and custody policy is recorded.

The contract test suite covers identity lifecycle, RBAC, asset allocation, controlled transfer paths, access decisions, pause behavior, and rejection paths. The API boundary tests cover fail-closed authentication, readiness, request correlation, and production configuration rejection. Contract tests must continue to cover unauthorized minting, unauthorized role changes, duplicate allocation, ownership transfer, event emission, paused or emergency states, and any upgradeability policy. Do not deploy an unreviewed contract to a public network.

### Future API, indexer, storage, and frontend

The full FastAPI transaction and audit API, durable PostgreSQL/Redis projections, managed encrypted object storage, and the Next.js/mobile client are planned components. The current `services/api` directory contains a fail-closed boundary and typed local transaction-state/authorization/rate-limit reference primitives; `services/indexer` contains confirmed RPC, projection, reorganization, and reconciliation primitives; `services/storage` contains an AES-GCM envelope reference; and `services/persistence` contains PostgreSQL-oriented schema primitives. Full routes, migrations, queues, storage adapters, and endpoints must be added only in the pull request that introduces the corresponding component and tests.

### Run quality checks

The current repository quality gate is:

```bash
pnpm validate:environment -- --file .env.example --environment local
pnpm validate:references
pnpm validate:markdown
pnpm lint
pnpm test
pnpm run test:coverage
pnpm build
pnpm test:services
```

Future transaction API, indexer, browser, storage, and accessibility checks must become mandatory CI checks when those components exist. Accessibility validation should combine automation with manual keyboard and screen-reader review.[3]

## Representative domain flows

### Identity registration

An authorized operator creates or registers an identity record, associates a DID or DID reference with the application subject, and emits an event containing only the minimum public verification material. Revocation and key rotation must be explicit operations. A DID reference is not a guarantee that the subject is a real-world person or organization; that assurance comes from the platform's approved verification process.

### Role and permission assignment

An administrator assigns a predefined role such as `ADMIN`, `MANAGER`, `AUDITOR`, or `USER`. Contracts enforce who may grant or revoke roles, and the API mirrors the resulting state for user interfaces. The implementation must define whether roles are global, tenant-scoped, asset-scoped, or time-bound before production deployment.

### Asset minting and allocation

An authorized manager mints a unique ERC-721 asset with a unique organizational asset ID and a fixed-size metadata hash, associates the token with an active identity, and emits a structured allocation event. Duplicate asset IDs are rejected. Owners can request access, but sensitive enterprise transfers require the manager-controlled transfer path; standard ERC-721 approvals are disabled in the MVP.

### Controlled access request

An active identity submits `requestAccess(tokenId, action)`. The contract evaluates the owner, manager, and auditor policy and emits `AccessDecision` with a `GRANTED` or `DENIED` result without reverting on denial. This preserves a committed decision event while keeping asset ownership separate from read or use permission.

### Verification and audit

A verifier reads contract state and events, confirms the token and organizational asset ID, checks ownership history, and compares the metadata hash with the approved encrypted off-chain object. If IPFS is used, the encrypted payload is referenced by its CID; a CID is not simply a SHA-256 file hash. Owners, managers, and auditors receive separate access decisions, and blockchain authorization cannot prevent copying after an authorized decryption.

## Default technology stack versus alternatives

| Capability | MVP default | Viable alternative | Decision criterion |
|---|---|---|---|
| Contract language | Solidity | Vyper | Use Solidity for ecosystem maturity and OpenZeppelin compatibility; reassess for specialized assurance needs |
| Contract framework | Hardhat | Foundry | Use Hardhat for TypeScript integration; use Foundry when Solidity-native testing and fuzzing become primary |
| Contract libraries | OpenZeppelin Contracts | Solmate or audited internal modules | Prefer well-maintained, reviewed primitives; never replace them only to reduce dependency count |
| Identity model | DID reference plus application verification | Enterprise PKI, Verifiable Credentials, or a permissioned identity network | Choose based on assurance, revocation, interoperability, and organizational policy |
| Blockchain | Local Hardhat network, then approved EVM testnet | Hyperledger Besu, Polygon PoS, private EVM network | Select for governance, finality, privacy, cost, operational ownership, and regulatory constraints |
| API | FastAPI + Pydantic + Web3.py | NestJS, Go, or a managed indexer | Choose based on team skills, latency, event-processing needs, and operational support |
| Database | PostgreSQL | MySQL/TiDB or a managed relational service | Use a relational projection for queryability; chain remains the ownership source of truth |
| Frontend | Next.js + React + TypeScript | Vite + React or another approved frontend | Choose based on deployment model, wallet support, accessibility, and team conventions |
| UI foundation | shadcn/ui and accessible primitives | Material UI or an internal design system | Select the system with the strongest accessibility and governance fit |
| Jobs | Redis + BullMQ | Celery, Temporal, or cloud queues | Use a durable workflow system when indexing, retries, and reconciliation become business-critical |
| Object storage | S3-compatible storage such as MinIO locally | Managed S3, Azure Blob, or encrypted enterprise storage | Select according to data residency, retention, encryption, and availability requirements |
| Browser testing | Cypress | Playwright | Use whichever is standardized by the organization; keep critical flows deterministic |
| Delivery | GitHub Actions + Docker Compose | GitLab CI, Azure DevOps, or Kubernetes | Select based on the organization's approved software supply-chain controls |

## Repository layout

```text
.
├── apps/
│   └── web/                  # Next.js web console
├── contracts/                # Solidity contracts, tests, scripts, deployments
├── services/
│   ├── api/                  # FastAPI application
│   └── indexer/              # Event ingestion and reconciliation
├── packages/
│   ├── types/                # Shared domain types and schemas
│   └── ui/                   # Reusable accessible UI components
├── config/                   # Environment schema and validation policy
├── MAINTENANCE.md             # Maintenance cadence and release evidence
├── docs/
│   ├── ADR/                      # Architecture Decision Records
│   ├── COMPLIANCE-REPORT.md      # Requirement and production-gate assessment
│   ├── PROBLEM-STATEMENT-TRACEABILITY.md
│   ├── THREAT-MODEL.md           # Threats, invariants, and abuse cases
│   ├── ACCEPTANCE-CRITERIA.md    # MVP demonstration criteria
│   ├── COMPREHENSIVE-IMPROVEMENT-AND-FIX-REGISTER.md
│   └── runbooks/                 # Operational procedures
├── .github/                  # Issues, workflows, ownership, and automation
├── .devcontainer/            # Reproducible development environment
└── docker-compose.yml        # Local infrastructure, when implementation lands
```

## Security and privacy boundaries

Treat private keys as high-impact credentials. Use a hardware-backed or managed key-management solution for privileged production actions, enforce multi-party approval where appropriate, and document key rotation and recovery. The contract administrator should not be a single unreviewed externally owned account in a production deployment.

The platform must not expose personal data through public events, token metadata, logs, error messages, or analytics. Hashing data does not automatically remove privacy risk when the underlying data can be recovered or linked. Define retention, erasure, revocation, subject-access, and legal-review procedures before storing identity-related data.

The repository's `SECURITY.md`, `ARCHITECTURE.md`, ADRs, [`docs/COMPLIANCE-REPORT.md`](docs/COMPLIANCE-REPORT.md), [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md), [`docs/ENCRYPTION-KEY-MANAGEMENT.md`](docs/ENCRYPTION-KEY-MANAGEMENT.md), [`docs/SECURITY-SCANNING-STATUS.md`](docs/SECURITY-SCANNING-STATUS.md), and [`docs/COMPREHENSIVE-IMPROVEMENT-AND-FIX-REGISTER.md`](docs/COMPREHENSIVE-IMPROVEMENT-AND-FIX-REGISTER.md) describe the intended controls, current evidence boundaries, and complete remediation backlog. They do not replace an organization-specific security assessment. The active implementation backlog is tracked in [Issue #12](https://github.com/tejaswin-amara/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management/issues/12).

## Maintenance and assurance status

This prototype is maintained through reviewed pull requests, scheduled dependency and security workflows, release automation, and the recurring checks documented in [`MAINTENANCE.md`](MAINTENANCE.md). The official [OpenSSF Best Practices assessment](https://www.bestpractices.dev/en/projects/new) is not yet registered for this project; the neutral badge above intentionally indicates **assessment pending** rather than claiming a completed badge level.

## Project status

The project is in an **active final-project execution phase**: the Solidity/Hardhat contract baseline and tested fail-closed API, indexer, persistence, and storage reference boundaries are implemented, while the integrated web console, approved identity provider, genuine PostgreSQL service, background worker, KMS/HSM custody, production storage adapter, and independent assurance remain gated work. This label does not claim production readiness, controlled-testnet approval, independent audit, legal approval, or BEL endorsement. The maintained execution roadmap is [`docs/FINAL-PROJECT-COMPLETION-PLAN.md`](docs/FINAL-PROJECT-COMPLETION-PLAN.md); progress, owners, evidence, and blockers must be updated as each gate is accepted.

## Contributing and support

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Security vulnerabilities must follow [`SECURITY.md`](SECURITY.md), not a public issue. General questions belong in [`SUPPORT.md`](SUPPORT.md). Architectural changes should follow the RFC and ADR workflow in [`GOVERNANCE.md`](GOVERNANCE.md). The current asset/network, authorization/upgradeability, durable database, final-project maturity, identity-adapter, event/projection, and reference-adoption boundaries are recorded in [`docs/ADR/0002-mvp-asset-standard-and-network-strategy.md`](docs/ADR/0002-mvp-asset-standard-and-network-strategy.md), [`docs/ADR/0003-mvp-authorization-and-upgradeability-boundary.md`](docs/ADR/0003-mvp-authorization-and-upgradeability-boundary.md), [`docs/ADR/0004-python-postgresql-durability.md`](docs/ADR/0004-python-postgresql-durability.md), [`docs/ADR/0005-final-project-scope-and-maturity-gates.md`](docs/ADR/0005-final-project-scope-and-maturity-gates.md), [`docs/ADR/0006-identity-and-credential-adapter-boundary.md`](docs/ADR/0006-identity-and-credential-adapter-boundary.md), [`docs/ADR/0007-canonical-event-and-projection-schema.md`](docs/ADR/0007-canonical-event-and-projection-schema.md), and [`docs/ADR/0008-reference-adoption-and-optional-integration-gates.md`](docs/ADR/0008-reference-adoption-and-optional-integration-gates.md). Proposal alignment and production-gate status are tracked in [`docs/COMPLIANCE-REPORT.md`](docs/COMPLIANCE-REPORT.md). Requirement-level evidence is mapped in [`docs/PROBLEM-STATEMENT-TRACEABILITY.md`](docs/PROBLEM-STATEMENT-TRACEABILITY.md).

## Curated reference projects

The repository preserves the 15 supplied SSI, DID, IAM, NFT, encrypted-storage, and permissioned-ledger projects as curated references. Review [`docs/REFERENCED-REPOSITORIES.md`](docs/REFERENCED-REPOSITORIES.md) for the original catalog, [`docs/REFERENCE-INTEGRATION.md`](docs/REFERENCE-INTEGRATION.md) for original adoption decisions, [`docs/reference-ledger.md`](docs/reference-ledger.md) for the complete 96-source utilization ledger, and [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md) for attribution and license boundaries. Only OpenZeppelin Contracts is currently adopted as a runtime dependency; the other projects and the expanded full-stack/tooling sources are not silently vendored, added as submodules, or represented as product components without a focused gate.

## License and citation

This project is released under the [MIT License](LICENSE). If this reference architecture informs research, internal engineering, or a derivative implementation, see [`CITATION.cff`](CITATION.cff) for citation metadata.

## References

The following sources are used throughout the README and architecture documentation:

### Standards and engineering guidance

1. [W3C Decentralized Identifiers (DIDs) v1.0][1]
2. [ERC-721: Non-Fungible Token Standard][2]
3. [Deque axe accessibility engine][3]
4. [OpenZeppelin Contracts documentation][4]
5. [The Twelve-Factor App: Config][5]
6. [GitHub Actions security hardening][6]
7. [OWASP Application Security Verification Standard][7]
8. [IPFS documentation][8]
9. [NIST SP 800-57 key-management guidance][9]
10. [NIST SP 800-38D authenticated encryption guidance][10]
11. [Contributor Covenant Code of Conduct][11]
12. [Keep a Changelog][12]
13. [Conventional Commits][13]
14. [GitHub repository licensing guidance][14]
15. [Apache License 2.0][15]
16. [BSD 3-Clause License][16]
17. [GNU GPLv3 license][17]

### Curated repositories

18. [SpruceID SSI][18]
19. [Sol DID][19]
20. [OpenZeppelin Contracts repository][20]
21. [NFT Minting DApp Starter][21]
22. [Markkop NFT Marketplace][22]
23. [Polygon NFT Marketplace][23]
24. [NFT Auction Platform][24]
25. [FIWARE Decentralized IAM][25]
26. [NFT Credential Management System][26]
27. [FileChain][27]
28. [encryptoNFT][28]
29. [Fileverse Self-Hosted Public Drive][29]
30. [Hyperledger Sawtooth Asset Management][30]
31. [Heka Identity Platform][31]
32. [WeIdentity][32]

[1]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
[2]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[3]: https://www.deque.com/axe/ "Deque axe accessibility engine"
[4]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[5]: https://12factor.net/config "The Twelve-Factor App: Config"
[6]: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions "GitHub Actions security hardening"
[7]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[8]: https://ipfs.tech/ "IPFS documentation and project site"
[9]: https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final "NIST SP 800-57 Part 1 key management"
[10]: https://csrc.nist.gov/publications/detail/sp/800-38d/final "NIST SP 800-38D Galois/Counter Mode"
[11]: https://www.contributor-covenant.org/version/2/1/code_of_conduct/ "Contributor Covenant version 2.1"
[12]: https://keepachangelog.com/en/1.1.0/ "Keep a Changelog"
[13]: https://www.conventionalcommits.org/en/v1.0.0/ "Conventional Commits"
[14]: https://docs.github.com/en/repositories/creating-and-managing-repositories/licensing-a-repository "GitHub licensing a repository guidance"
[15]: https://www.apache.org/licenses/LICENSE-2.0 "Apache License 2.0"
[16]: https://opensource.org/license/bsd-3-clause/ "BSD 3-Clause License"
[17]: https://www.gnu.org/licenses/gpl-3.0.html "GNU General Public License v3.0"
[18]: https://github.com/spruceid/ssi "SpruceID SSI repository"
[19]: https://github.com/identity-com/sol-did "Sol DID repository"
[20]: https://github.com/OpenZeppelin/openzeppelin-contracts "OpenZeppelin Contracts repository"
[21]: https://github.com/tomhirst/nft-minting-dapp-starter "NFT Minting DApp Starter repository"
[22]: https://github.com/Markkop/nft-marketplace "Markkop NFT Marketplace repository"
[23]: https://github.com/obinnafranklinduru/NFT-MarketPlace "Polygon NFT Marketplace repository"
[24]: https://github.com/furkanenesdagli/NFT_auction "NFT Auction Platform repository"
[25]: https://github.com/FIWARE/decentralized-iam "FIWARE Decentralized IAM repository"
[26]: https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem "NFT Credential Management System repository"
[27]: https://github.com/akash70629/FileChain "FileChain repository"
[28]: https://github.com/El-hacen21/encryptoNFT "encryptoNFT repository"
[29]: https://github.com/fileverse/self-hosted-public-drive "Fileverse Self-Hosted Public Drive repository"
[30]: https://github.com/hkhuang07/asset-management-sawtooth "Hyperledger Sawtooth Asset Management repository"
[31]: https://github.com/hiero-ledger/heka-identity-platform "Heka Identity Platform repository"
[32]: https://github.com/WeBankBlockchain/WeIdentity "WeIdentity repository"
