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
