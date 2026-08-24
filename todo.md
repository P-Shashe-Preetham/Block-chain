# Delivery Exception Checklist

- [x] Record the user-authorized source-push exception, including the unresolved sandbox environment-validation and Compose bridge-network gates.
- [ ] Recheck the branch, remote tracking, exact local commit range, and absence of sensitive/generated files before push.
- [ ] Push the clean feature branch once without force-push, merge, or branch-protection bypass.
- [ ] Monitor the resulting CI, CodeQL, Slither, Echidna, dependency/supply-chain, and web E2E checks on the pushed commit.
- [ ] Record remote check outcomes and preserve unresolved external identity, network, custody, legal, organizational, and reviewer gates.
- [ ] Do not merge, self-approve, simulate review, or make testnet/production readiness claims.
