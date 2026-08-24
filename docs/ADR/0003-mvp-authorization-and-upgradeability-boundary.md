# ADR 0003: MVP authorization and upgradeability boundary

- **Status:** Accepted for the disposable MVP; production decisions remain open
- **Date:** 2026-08-22
- **Scope:** `SecureAssetPlatform` authorization, asset lifecycle, identity assurance, and upgradeability

## Context

The MVP must demonstrate identity references, role-controlled asset operations, lifecycle denial, auditable events, and a clear boundary between on-chain facts and future enterprise services. It must not imply that an address is a verified employee, that a `bytes32` field is a complete DID method, or that an unreviewed deployment is production-safe.

## Decisions

The current contract is **non-upgradeable**. No proxy, delegatecall upgrade authority, or storage-layout migration path is introduced in the MVP. Any future upgradeability or migration design must be a separate, independently reviewed architecture decision with storage compatibility, authority transfer, pause, rollback, event, and user-communication evidence. The deployment manifest records compiler, optimizer, EVM target, source commit, ABI hash, and bytecode hash so a deployed artifact can be independently identified.

The MVP retains an **ERC-721-compatible interface with controlled enterprise transfers**. Approval methods remain disabled, and every transfer overload is manager-gated, active-identity-gated, pause-aware, and status-aware. This compatibility boundary is provisional: a production decision must compare standard wallet/indexer interoperability against non-transferable or permissioned asset semantics.

The role graph remains intentionally small for the MVP. The immutable root administrator administers `MANAGER_ROLE`, `AUDITOR_ROLE`, and `USER_ROLE`; grants require a registered active identity; deactivation removes non-root roles; and manager-only operations additionally require the caller to be active. The MVP does not claim scoped tenants, two-person approvals, multisignature custody, or independent recovery authority. Those are production gates, not hidden assumptions.

Asset lifecycle status is limited to `ACTIVE`, `SUSPENDED`, `REVOKED`, and `RETIRED`. Active assets may transition to any non-active status; suspended assets may return to active or progress to revoked/retired; revoked assets may only become retired; and retired assets are terminal. Suspended, revoked, and retired assets remain queryable but cannot be accessed or transferred. A future lifecycle must add approved proposed/verified/recovered semantics only with a written transition matrix and legal/records review.

Identity assurance and off-chain authentication provider selection are **deferred**. The current chain field is a unique non-zero DID-hash reference, not a DID method, DID document, resolver, or employee-verification authority. The current API therefore fails closed and rejects unsigned, unverified, wallet-header, or decoded-only bearer claims. Before any non-local API is enabled, an approved method must define domain/URI/chain ID/nonce/expiry/audience checks, key rotation, replay/session binding, offboarding, and recovery evidence.

## Consequences

The MVP is deterministic and easier to audit because it avoids an implicit upgrade administrator and keeps the contract source of truth narrow. It also cannot repair a deployed contract in place; an approved migration must be explicit and cannot erase immutable history. The manager role is still concentrated, so testnet/pilot use remains blocked until governance, custody, independent review, and recovery controls are approved.

The API, indexer, storage, and frontend may project or improve usability but must not override these contract decisions or report a transaction as final before canonical confirmation. All future changes must update this ADR or supersede it with a reviewed ADR, the threat model, acceptance criteria, deployment policy, and remediation register.

## Required evidence before testnet

A testnet proposal must include an approved network and chain-finality policy, a non-disposable custody design, independent contract review, complete role/transition tests, a real identity-assurance decision, deployment-manifest verification, smoke tests, and a documented risk owner. None of these requirements is satisfied merely by this ADR or by local Hardhat success.
