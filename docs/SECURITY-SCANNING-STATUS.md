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
| Missing fuzzing integration | Added a pinned Echidna workflow and expanded stateful invariant harness for administrator, identity, lifecycle, transfer, access-rule, pause, and approval controls, plus a fast-check TypeScript property suite recognized by Scorecard | `.github/workflows/fuzz.yml`, `contracts/test/SecureAssetPlatformEchidna.sol`, `contracts/test/IdentityReference.property.test.ts` |
| Vulnerable transitive dependencies | Migrated from Hardhat 2 to Hardhat 3, removed the vulnerable ethers v5 dependency path, retained explicit narrow plugins, and kept a moderate-or-higher CI audit gate | `package.json`, `pnpm-lock.yaml`, `hardhat.config.ts`, `.github/workflows/ci.yml` |
| Missing reference/security validation | Existing reference validator and CI checks remain active alongside the Python service, Markdown-table, and pinned Solidity static-analysis gates | `scripts/validate_references.py`, `scripts/validate_markdown_tables.py`, `.github/workflows/ci.yml`, `.github/workflows/slither.yml` |
| Missing Solidity-specific static analysis | Added pinned Slither 0.11.4 analysis of the production contract surface with SARIF upload and failure on high-severity findings. Local review found only low-severity timestamp-use findings, which remain visible for review rather than being suppressed. | `.github/workflows/slither.yml`, `/tmp/slither-production.txt` local analysis |

## Current alert remediation status

The current dashboard alerts are tracked explicitly rather than dismissed without evidence:

| Alert | Signal | Severity shown | Current status and evidence |
|---:|---|---|---|
| #19 | Maintained | High | Repository-side maintenance evidence has been strengthened with `MAINTENANCE.md`, scheduled workflows, Dependabot, release automation, contribution guidance, and security policy. The remaining age component is detector-controlled and resolves only after the repository has sufficient history. |
| #17 | Code-Review | High | `main` is protected and requires reviewed pull requests, one approving review, conversation resolution, linear history, and successful security checks. Historical direct commits cannot be retroactively converted into approved changesets; an eligible collaborator must approve future remediation PRs for the historical ratio to improve. |
| #20 | SAST | Medium | CodeQL runs successfully on current pushes and pull requests. The remaining Scorecard ratio reflects that the workflow was introduced after earlier commits; historical commits cannot be retroactively scanned by a workflow that did not exist at those revisions. |
| #16 | CII-Best-Practices | Low | The repository now links the official OpenSSF Best Practices assessment and clearly marks it as pending. Registration and assessment require the repository owner to authenticate at [bestpractices.dev](https://www.bestpractices.dev/en/projects/new) and complete the external questionnaire. |

## Remaining external or upstream limits

The dependency audit is now clean: `pnpm audit --audit-level=moderate` reports no known vulnerabilities, and the Hardhat 3 lockfile contains no `elliptic` package. The previous low advisory was removed by eliminating the Hardhat 2 ethers v5 dependency path rather than forcing an unpublished package version. Fuzzing evidence now includes both the passing Echidna workflow and the passing TypeScript fast-check property suite.

| Finding or Scorecard signal | Why it cannot be fixed only by a commit | Required action |
|---|---|---|
| Branch protection score | Branch protection is controlled by GitHub repository settings rather than source files; the documented policy is the configuration to verify | Verify that main requires one approving review, successful CodeQL/Echidna/Scorecard/CI checks, linear history, conversation resolution, no force pushes, and administrator enforcement |
| Code-review score | Historical direct pushes cannot be converted into reviewed changesets; the repository now requires reviewed pull requests for future changes | Continue using pull requests and obtain one approval before merging |
| Maintained score | The repository's age/history is evaluated by Scorecard, including the detector's recent-commit and issue-activity inputs | Continue the documented maintenance cadence, keep publishing releases and updates, and reassess after the repository history matures |
| CII Best Practices score | Scorecard reads the official OpenSSF Best Practices service; a source-controlled link cannot create an assessment or badge | The repository owner must [log in with GitHub and register the project](https://www.bestpractices.dev/en/projects/new), then complete the external assessment |
| GitHub alert API visibility | The current integration returned HTTP 403 for code-scanning, Dependabot, and secret-scanning alert endpoints | Review alerts in the repository's Security tab or grant the integration the required read scopes |

## Validation baseline

The repository must pass `pnpm install --frozen-lockfile`, `pnpm validate:references`, `pnpm validate:environment`, `pnpm validate:markdown`, `pnpm audit --audit-level=moderate`, the hash-locked Python service install, combined API/indexer tests, strict TypeScript lint, Hardhat compilation, the contract test suite, coverage, and configuration parsing. CodeQL, Echidna, Slither, and Scorecard results are produced by GitHub Actions after workflow files are pushed; they cannot be fully reproduced by the local Hardhat test command alone. PR #13 is stacked on PR #11 and remains review-pending; no protected-branch merge bypass is used.

## References

[1]: https://github.com/ossf/scorecard "OpenSSF Scorecard"
[2]: https://codeql.github.com/docs/ "GitHub CodeQL documentation"
[3]: https://github.com/crytic/echidna "Echidna smart-contract fuzzer"
[4]: https://bestpractices.dev/ "OpenSSF Best Practices"
[5]: https://pnpm.io/audit "pnpm audit documentation"
[6]: https://osv.dev/GHSA-848j-6mx2-7j84 "Elliptic advisory reference"
