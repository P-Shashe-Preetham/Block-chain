# Contributing to Blockchain Secure Platform

Thank you for contributing to the Blockchain Secure Platform. The project combines smart contracts, identity workflows, backend services, and security-sensitive user interfaces, so every contribution must make its trust assumptions explicit and preserve the separation between on-chain truth and off-chain convenience.

## Before you begin

Read the [Code of Conduct](CODE_OF_CONDUCT.md), [Security Policy](SECURITY.md), [Architecture](ARCHITECTURE.md), and [Governance](GOVERNANCE.md). Do not open a public issue for a suspected vulnerability, leaked credential, private key, seed phrase, or bypass of authorization. Use the private reporting path in `SECURITY.md`.

This repository is currently an MVP documentation and implementation baseline. A change that is acceptable for a local prototype may still be unsuitable for a testnet or production deployment. State the deployment context in the pull request.

## Contribution lifecycle

### 1. Create or select an issue

For a defect, reproduce the behavior and include the smallest safe diagnostic detail. For a feature, describe the user or operator problem, the intended trust boundary, and the acceptance criteria. Architectural changes should be discussed as an RFC before implementation when they affect contracts, identity assurance, data retention, key management, or deployment topology.

### 2. Fork and branch

Fork the repository if you are not a member of the maintainer team, then create a focused branch from the default branch. Branch names should use one of the following forms:

| Change type | Branch pattern | Example |
|---|---|---|
| New feature | `feat/<short-description>` | `feat/asset-verification` |
| Bug fix | `fix/<short-description>` | `fix/role-revocation` |
| Security fix | `security/<short-description>` | `security/restrict-mint-role` |
| Documentation | `docs/<short-description>` | `docs/key-rotation-runbook` |
| Refactor | `refactor/<short-description>` | `refactor/indexer-retries` |
| Maintenance | `chore/<short-description>` | `chore/upgrade-hardhat` |

Keep branches short-lived and avoid mixing unrelated changes. Never place secrets or real identity data in a branch, commit, test fixture, screenshot, or issue.

### 3. Prepare the local environment

Use the repository's documented runtime versions and copy `.env.example` to `.env`. Install dependencies with the approved package managers. If pre-commit hooks are configured, install and run them before committing.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm validate:environment -- --file .env.example --environment local
pnpm validate:references
pnpm lint
pnpm test
pnpm run test:coverage
pnpm build
pnpm test:api
```

The current checkout implements the Solidity/Hardhat MVP and a fail-closed FastAPI boundary. Full transaction API, indexer, database, storage, and frontend commands must be added to this list in the same pull request that introduces those components; a clean checkout must never invoke a missing path or silently ignore a failed setup step.

### 4. Implement the change

Prefer small, reviewable commits. Maintain the existing directory boundaries and naming conventions. Contract code must use explicit authorization checks, fail closed, emit events for auditable state changes, and include tests for both successful and rejected paths. Identity-related code must minimize data collection, avoid logging sensitive values, and document revocation or key-rotation behavior.

When a change modifies a public contract interface, event schema, storage layout, environment variable, API route, or user-visible permission, update the relevant architecture documentation and add an ADR or migration note when the change is not backward-compatible.

### 5. Commit using Conventional Commits

Use the Conventional Commits format so release notes and automation can classify changes consistently.[1]

```text
<type>(<optional-scope>): <imperative summary>

<body explaining context and security impact when useful>

<footer with issue references or BREAKING CHANGE notes>
```

Common types include `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, and `chore`. Do not use commit messages to disclose vulnerability details.

### 6. Open a pull request

Open a draft pull request early when design feedback is useful. Complete the pull-request template, link the issue, describe deployment impact, and identify any contract, migration, privacy, or security implications. Request review from the owners defined in `.github/CODEOWNERS` when that file is populated.

### 7. Respond to review and merge

Address review comments with new commits or explain the decision. Do not force-push after approval if it would make the review difficult to audit unless the maintainer requests it. A maintainer may squash or rebase commits according to the repository's release policy. The default branch should remain green and protected.

## Pull-request checklist

Before requesting final review, confirm the following:

- The change has a linked issue or an approved RFC.
- The title and commits follow the repository's Conventional Commits policy.
- [ ] Tests cover expected behavior, rejection paths, and relevant authorization boundaries.
- [ ] `pnpm validate:environment`, `pnpm validate:references`, `pnpm lint`, `pnpm test`, `pnpm run test:coverage`, `pnpm build`, and `pnpm test:api` pass for the current MVP/API boundary; future-service checks are listed only after their components exist.
- Contract changes include event, access-control, reentrancy, upgradeability, and gas-impact review as applicable.
- API changes include validation, authentication/authorization, error handling, and migration considerations.
- UI changes include keyboard navigation, visible focus, semantic labels, and an automated accessibility check where practical.
- Documentation, diagrams, environment templates, and ADRs are synchronized with the code.
- No secrets, personal data, private keys, seed phrases, or unapproved third-party assets were added.
- The local lint, test, build, and relevant end-to-end checks pass.
- The pull request states whether it is prototype-only, testnet-ready, or intended for a production path.

## Testing expectations

A passing test suite does not prove a smart contract or identity system is secure. Add negative tests for unauthorized callers, invalid state transitions, replay or duplicate operations, revoked identities, and malformed metadata. For indexing code, test retries, idempotency, reorg or confirmation handling, and reconciliation against contract state. For the frontend, test permission-aware rendering and error states rather than only the happy path.

## Documentation contributions

Documentation changes should be written for a new contributor and an informed security reviewer. Prefer direct language, explain assumptions, and link to authoritative standards. If a statement depends on a chain, wallet, DID method, or organizational policy, label it as an assumption instead of presenting it as universal behavior.

## Maintainer review expectations

Maintainers should review changes for correctness, security, privacy, operability, accessibility, testability, and long-term ownership. The Google Engineering Practices guidance is a useful baseline for review quality and reviewer behavior.[2]

## References

[1]: https://www.conventionalcommits.org/en/v1.0.0/ "Conventional Commits specification"
[2]: https://google.github.io/eng-practices/review/ "Google Engineering Practices: Code Review"
