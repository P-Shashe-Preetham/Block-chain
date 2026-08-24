# Local Development Readiness

## Purpose

Run this lightweight prerequisite check before the project’s normal EVM contract, service, web, verifier, and bounded Compose validation. It is project-owned and chain-neutral. Its developer-experience pattern was assessed from AlgoKit’s documented `doctor`/LocalNet workflow, but the command **does not install, invoke, or depend on AlgoKit**.

## Command

```bash
pnpm check:local-readiness
```

The command checks the project’s required Node.js major version, pinned pnpm version, installed Hardhat binary, web workspace dependencies, and Docker Compose command availability. It emits JSON and exits non-zero if a prerequisite is absent or incompatible.

## Follow-up sequence

```bash
pnpm install --frozen-lockfile
pnpm validate:environment
pnpm lint
pnpm test
```

For the entire evaluation suite, follow the evidence record and the relevant contract, verifier, web, persistence, and Compose runbooks. Docker Compose command availability is not a claim that this sandbox can produce bridge-network runtime health evidence.

## Boundary

This runbook does not select Algorand or any other network. The canonical platform remains EVM/Hardhat until a reviewed architecture decision and accountable external approvals change that fact. See [ADR 0010](../ADR/0010-algokit-development-acceleration-boundary.md).
