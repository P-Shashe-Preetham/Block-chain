# Contract Assurance Runbook

## Purpose and scope

This runbook collects repeatable local checks for the canonical `SecureAssetPlatform` contract. Passing these checks is regression evidence only; it is not an independent audit, formal proof, production deployment approval, custody approval, or legal/privacy assurance.

## Required local commands

```bash
pnpm lint
pnpm test
pnpm test:coverage
pnpm validate:indexer-abi
pnpm test:echidna
```

`pnpm test:echidna` runs the property campaign in a pinned Echidna container image. The campaign mirrors the protected workflow: Solidity `0.8.24`, `SecureAssetPlatformEchidna`, property mode, test limit `1000`, and sequence length `20`. Docker is a local prerequisite. If a constrained sandbox requires host networking, set `ECHIDNA_DOCKER_NETWORK=host` only for that local test environment; do not add network configuration to production source or deployment controls.

## Expected result and triage

| Result | Required action |
|---|---|
| All `echidna_*` properties pass | Retain sanitized command output and continue to the remaining release checks. |
| Any property fails | Treat the contract gate as failed. Preserve the minimized sequence/corpus, repair the owning invariant or implementation, add a deterministic regression test, and restart the release gate. |
| Compiler/image/Docker failure | Do not mark the fuzz gate as passed. Repair the reproducibility issue or run the protected workflow after all other local gates are green. |
| Static-analysis finding | Classify it in the remediation register; a non-high finding is not an automatic production approval. |

The 2026-08-23 local campaign passed eight current stateful invariants. Its output digest is retained in the local release-gate evidence. The campaign does not replace broader invariant design, independent review, or approved deployment testing.
