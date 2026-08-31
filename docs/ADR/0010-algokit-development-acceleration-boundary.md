# ADR 0010: AlgoKit Development-Acceleration Boundary

**Status:** Accepted  
**Date:** 2026-08-24

## Context

AlgoKit is an MIT-licensed Algorand development kit. Its official materials describe a CLI, templates, LocalNet, AVM debugging, deployment/configuration utilities, client generation, and Python/TypeScript support for Algorand applications.[1] [2] The local development and `doctor`-style readiness concepts are useful development-experience references.

The current project’s canonical ledger boundary is different: Solidity `0.8.24`, EVM Cancun, Hardhat, ERC-721/OpenZeppelin semantics, direct EVM RPC verification, and an EVM ABI-driven indexer. The existing contract, verifier, test corpus, and CI evidence are specific to this boundary. AlgoKit targets the Algorand Virtual Machine and Algorand application/asset model, not Solidity/EVM contracts or ERC-721.[1] [3]

## Decision

The project adopts **one project-owned, chain-neutral development-acceleration practice** inspired by AlgoKit: `pnpm check:local-readiness`. It gives contributors a fast, reproducible prerequisite report before they run the existing EVM contract, service, web, and bounded Compose workflows. The command is implemented entirely in project-owned source, invokes no AlgoKit program, sends no data, and never creates accounts, wallets, transactions, assets, or deployments.

The project does **not** install the AlgoKit CLI, AlgoKit Utils, Algorand SDKs, LocalNet, templates, wallet integration, AVM compiler, or client generator. It does not vendor AlgoKit code. It does not select Algorand, create an Algorand network, use a dispenser, mint an Algorand asset, or represent the existing EVM asset model on Algorand.

## Consequences

This decision preserves the canonical Solidity/Hardhat baseline and avoids a second ledger authority, a second asset standard, a second wallet/custody model, and duplicate indexer/verifier/deployment surfaces. It provides a measurable onboarding acceleration: contributors can detect required local tool gaps with one project command before expensive validation.

Any future Algorand proof of concept requires a new ADR that identifies the business requirement, selected network, identity and asset mapping, migration/interoperability plan, custody, privacy, data classification, architecture owner, license review, threat model, independent assurance scope, and removal path. It must use an isolated optional workspace and may not replace or silently mirror canonical EVM facts until the accountable authorities approve it.

AlgoKit LocalNet requires Docker. The existing sandbox lacks usable bridge-network runtime support, so LocalNet cannot provide valid acceleration evidence for the current environment. The project retains its disposable Hardhat local-chain evidence until a reviewed network architecture decision changes that boundary.

## References

[1] [AlgoKit Introduction](https://dev.algorand.co/algokit/algokit-intro/)

[2] [AlgoKit CLI repository](https://github.com/algorandfoundation/algokit-cli) — MIT license reported by GitHub.

[3] [AlgoKit Templates](https://dev.algorand.co/algokit/official-algokit-templates/)
