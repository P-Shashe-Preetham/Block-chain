# Delivery Exception Checklist

- [x] Record the user-authorized source-push exception, including the unresolved sandbox environment-validation and Compose bridge-network gates.
- [x] Recheck the branch, remote tracking, exact local commit range, and absence of sensitive/generated files before push.
- [x] Push the clean feature branch once without force-push, merge, or branch-protection bypass.
- [x] Monitor the resulting CI, CodeQL, Slither, Echidna, dependency/supply-chain, and web E2E checks on the pushed commit.
- [x] Record remote check outcomes and preserve unresolved external identity, network, custody, legal, organizational, and reviewer gates.
- [ ] Do not merge, self-approve, simulate review, or make testnet/production readiness claims.
- [x] Inspect the Ponytail repository license, scope, current architecture, and reproducible optimization patterns without vendoring or installing it.
- [x] Map compatible optimization findings to the source ledger, engineering defaults, and remediation register with explicit non-adoptions for incompatible components.
- [x] Implement and validate only project-owned, compatible optimization improvements; preserve the canonical contract, FastAPI, PostgreSQL, and fail-closed authority boundaries.
- [x] Add disposable local-chain end-to-end evidence for the independent verifier, including code-hash mismatch behavior.
- [x] Add PostgreSQL concurrency and durable replay/reconciliation regression evidence without introducing unapproved workers or queue infrastructure.
- [x] Add project-owned web performance-budget enforcement and preserve accessibility/browser-security evidence.
- [x] Strengthen safe API/persistence boundaries only where they require no unapproved identity, custody, network, or tenant decision.
- [x] Prepare evidence-based decision packets for identity, custody, storage/KMS, hosting, operations, legal, assurance, and release authority.
- [x] Add a provider-neutral staging authorization and evidence runbook for synthetic-only deployment, health, denial, restore, rollback, alerting, and accessibility drills.
- [ ] Obtain accountable approvals before selecting any provider, creating staging resources, configuring a real identity/chain/KMS/storage service, or treating the template as deployment evidence.
<<<<<<< HEAD
- [x] Inventory all remote branches, open pull requests, protection rules, and code-scanning alerts; classify actionable findings without closing or suppressing evidence prematurely.
- [x] Construct a reviewable linear-history consolidation branch from `main`, preserving eligible repository content and current dependency updates without force-pushing or protected-branch changes.
- [ ] Push the consolidation branch, verify required remote checks on its exact head, obtain a legitimate non-author approval, and merge only through the protected `main` workflow.
- [ ] Keep externally controlled Scorecard findings open until repository age/history, genuine approved changesets, historical SAST coverage, or owner-authenticated OpenSSF assessment independently resolves them.
- [x] Assess AlgoKit against the canonical EVM/Hardhat architecture and adopt only a project-owned local-readiness check inspired by its doctor workflow; do not install or deploy an Algorand stack without a reviewed ADR.
- [ ] Obtain a named architecture/network/custody/identity owner decision before evaluating any isolated Algorand proof of concept, LocalNet, wallet, SDK, asset, or deployment integration.
- [x] Use Docker through an authorized daemon to validate Compose configuration and rebuild all local images from a clean cache; record the bounded runtime result and clean all disposable resources.
- [ ] Reproduce the timed-out Docker migration/API/web health workflow on a Docker-capable host with functioning bridge networking before treating multi-container runtime health as verified evidence.
=======
>>>>>>> origin/feat/api-fail-closed-auth-baseline
