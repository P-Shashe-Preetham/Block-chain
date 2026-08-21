# Code-Scanning Remediation Status

## Scope

This document records the remediation applied to the repository's OpenSSF Scorecard and dependency-scanning findings. It separates fixes that can be committed in source control from controls that require GitHub repository settings, historical pull-request activity, or upstream package releases.

## Applied repository fixes

| Finding | Remediation | Evidence |
|---|---|---|
| Unpinned GitHub Actions | Pinned checkout, pnpm, Node, CodeQL, Scorecard upload, artifact, and Echidna actions to immutable commit SHAs | `.github/workflows/*.yml` |
| Excess release token permissions | Moved write permissions from workflow scope to the release job; workflow scope is read-only | `.github/workflows/release.yml` |
| Runtime release package resolution | Locked semantic-release and plugin versions in `package.json`/`pnpm-lock.yaml`; release uses `pnpm exec semantic-release` | `package.json`, `pnpm-lock.yaml`, `release.yml` |
| Missing SAST workflow | Added CodeQL analysis for JavaScript/TypeScript on pushes, pull requests, schedule, and manual dispatch | `.github/workflows/codeql.yml` |
| Missing fuzzing integration | Added a pinned Echidna workflow and invariant harness for administrator and approval controls | `.github/workflows/fuzz.yml`, `contracts/test/SecureAssetPlatformEchidna.sol` |
| Vulnerable transitive dependencies | Migrated from Hardhat 2 to Hardhat 3, removed the vulnerable ethers v5 dependency path, retained explicit narrow plugins, and kept a moderate-or-higher CI audit gate | `package.json`, `pnpm-lock.yaml`, `hardhat.config.ts`, `.github/workflows/ci.yml` |
| Missing reference/security validation | Existing reference validator and CI checks remain active alongside the new security gates | `scripts/validate_references.py`, `.github/workflows/ci.yml` |

## Remaining external or upstream limits

The dependency audit is now clean: `pnpm audit --audit-level=moderate` reports no known vulnerabilities, and the Hardhat 3 lockfile contains no `elliptic` package. The previous low advisory was removed by eliminating the Hardhat 2 ethers v5 dependency path rather than forcing an unpublished package version.

| Finding or Scorecard signal | Why it cannot be fixed only by a commit | Required action |
|---|---|---|
| Branch protection score | Branch protection is controlled by GitHub repository settings rather than source files; the documented policy is the configuration to verify | Verify that main requires one approving review, successful CodeQL/Echidna/Scorecard/CI checks, linear history, conversation resolution, no force pushes, and administrator enforcement |
| Code-review score | Historical direct pushes cannot be converted into reviewed changesets; the repository now requires reviewed pull requests for future changes | Continue using pull requests and obtain one approval before merging |
| Maintained score | The repository's age/history is evaluated by Scorecard | Continue maintained releases and reassess after the repository history matures |
| CII Best Practices score | A project badge requires registration and completion on bestpractices.dev | Register the project and complete the external assessment when ownership and contacts are ready |
| GitHub alert API visibility | The current integration returned HTTP 403 for code-scanning, Dependabot, and secret-scanning alert endpoints | Review alerts in the repository's Security tab or grant the integration the required read scopes |

## Validation baseline

The repository must pass `pnpm install --frozen-lockfile`, `pnpm validate:references`, `pnpm audit --audit-level=moderate`, strict TypeScript lint, Hardhat compilation, the contract test suite, and configuration parsing. CodeQL and Echidna results are produced by GitHub Actions after the workflow files are pushed; they cannot be fully reproduced by the local Hardhat test command alone. At the time of the latest branch-protection update, the only remote branch was `main`; all historical Dependabot pull requests were already merged, so there was no additional branch to merge.

## References

[1]: https://github.com/ossf/scorecard "OpenSSF Scorecard"
[2]: https://codeql.github.com/docs/ "GitHub CodeQL documentation"
[3]: https://github.com/crytic/echidna "Echidna smart-contract fuzzer"
[4]: https://bestpractices.dev/ "OpenSSF Best Practices"
[5]: https://pnpm.io/audit "pnpm audit documentation"
[6]: https://osv.dev/GHSA-848j-6mx2-7j84 "Elliptic advisory reference"
