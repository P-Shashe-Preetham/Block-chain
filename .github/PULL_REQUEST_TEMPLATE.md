# Pull request

## Summary

Describe what changed and why. State whether the change is prototype-only, testnet-ready, pilot-related, or intended for a production-readiness path.

## Related issue or RFC

Closes #

RFC or ADR:

## Change classification

- [ ] Feature
- [ ] Bug fix
- [ ] Smart-contract change
- [ ] Identity or authorization change
- [ ] API or indexer change
- [ ] UI or accessibility change
- [ ] Documentation
- [ ] CI, dependency, or infrastructure change
- [ ] Breaking change

## Trust and security impact

Explain changes to identity assurance, roles, permissions, keys, ownership, metadata, events, privacy, deployment, or threat assumptions. If there is no impact, state why.

## Implementation notes

Describe important design decisions, migrations, event-schema changes, compatibility concerns, and operational steps. Link the relevant ADR or RFC when applicable.

## Validation performed

List exact commands and results. Include negative authorization tests and reconciliation or migration tests where relevant.

```text
pnpm lint
pnpm test
pnpm build
python -m pytest services/api/tests
# Add targeted contract, indexer, browser, or accessibility commands.
```

## Accessibility review

- [ ] Keyboard navigation and visible focus were checked for UI changes.
- [ ] Semantic labels, error messaging, contrast, and state changes were reviewed.
- [ ] Automated axe-core or equivalent checks were run where applicable.
- [ ] No accessibility impact; explain why:

## Data and migration review

- [ ] No secrets, private keys, seed phrases, credentials, or real identity data were added.
- [ ] `.env.example` and configuration documentation are synchronized.
- [ ] Database, indexer, token, or metadata migrations are backward-compatible or documented.
- [ ] Deployment, rollback, reconciliation, and monitoring steps are documented when needed.

## Reviewer guidance

Please review correctness, authorization, privacy, event completeness, failure behavior, operability, accessibility, and maintainability. A passing CI run is necessary but is not evidence of a smart-contract audit or production readiness.

## Maintainer checklist

- [ ] Linked issue/RFC is complete.
- [ ] Required CODEOWNERS reviewers participated.
- [ ] Security or contract review completed when applicable.
- [ ] Documentation and changelog updated.
- [ ] Release or migration notes prepared when applicable.
