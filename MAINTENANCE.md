# Maintenance Policy

## Status

This repository is an actively maintained **prototype/MVP** for the Smart India Hackathon 2026 Problem Statement 26125 reference implementation. It is not a production security certification, an operational BEL system, or a substitute for an approved enterprise maintenance agreement.

## Maintenance cadence

Maintainers review pull requests and security reports continuously during active development. Dependency updates are reviewed through the configured Dependabot schedules, and the CI, CodeQL, Echidna, and OpenSSF Scorecard workflows run on their configured pull-request, push, scheduled, or manual triggers. Release notes are maintained in [`CHANGELOG.md`](CHANGELOG.md) using the Keep a Changelog structure.

At minimum, maintainers should review the following each month while the MVP is active:

| Area | Maintenance action |
|---|---|
| Dependencies | Review Dependabot updates, run the frozen install and moderate-or-higher audit gate, and remove stale packages. |
| Smart contracts | Run compilation, unit tests, coverage, Echidna invariants, and a focused review of authorization and asset-transfer paths. |
| CI/CD | Review pinned action SHAs, permissions, required branch-protection checks, and workflow failures. |
| Documentation | Keep the problem-statement traceability, threat model, acceptance criteria, references, and security-scanning status synchronized with implementation. |
| Operations | Review secrets, test accounts, deployment records, key-recovery procedures, and environment-specific runbooks before any public-network activity. |

## Release and support expectations

The default branch is protected and changes should be made through reviewed pull requests. Security reports must follow [`SECURITY.md`](SECURITY.md); general questions should follow [`SUPPORT.md`](SUPPORT.md). Each release should update the changelog, preserve reproducible dependency state, and record validation evidence.

The project remains best-effort until an owning organization approves production scope, support contacts, service-level expectations, and a deployment policy. Maintainers must not claim that the repository has passed an independent smart-contract audit or that it stores production identity data safely without separate evidence.

## Maintenance evidence

The current maintenance evidence is visible in the repository's scheduled workflows, Dependabot configuration, release automation, changelog, contribution policy, security policy, pull-request template, and validation scripts. The OpenSSF Scorecard **Maintained** signal also considers repository age and recent project activity; those detector inputs cannot be retroactively rewritten by documentation.
