# ADR 0002: MVP Asset Standard and Network Strategy

- **Status:** Accepted for local MVP; production selection remains open
- **Date:** 2026-08-21
- **Decision owners:** Maintainers, technical lead, security lead, and contract reviewer
- **Review trigger:** Before testnet deployment or when the target organization approves a network and custody model

## Context

The supplied BEL architecture proposal names ERC-721/ERC-1155 and Hyperledger Fabric/private Polygon as candidate standards and deployment environments. The problem statement requires unique, traceable digital assets, controlled minting/allocation, RBAC enforcement, and an immutable audit trail. The repository must provide a concrete local MVP path without presenting an unapproved public or private network as a production decision.

## Decision

Use **ERC-721-compatible unique tokens**, **ECDSA/secp256k1 wallet authentication**, and a **local Hardhat EVM network** for the MVP contract baseline. Store only fixed-size asset and metadata hashes on-chain. Sensitive payloads must be encrypted before IPFS or object-storage use; a CID is an encrypted-content reference, not a raw file hash or confidentiality control. The MVP disables standard ERC-721 approvals and requires the manager workflow for transfers. Keep the production network decision open between an approved permissioned EVM/private Polygon strategy, Hyperledger Fabric integration, or another organization-approved network after privacy, finality, governance, validator ownership, and data-residency review.

The MVP contract uses `MANAGER_ROLE` for asset creation/allocation and controlled transfers, `AUDITOR_ROLE` for explicit access-decision reads, `USER_ROLE` for ordinary subjects, and `DEFAULT_ADMIN_ROLE` for tightly controlled administration. Identity deactivation revokes operational roles. Transfer paths enforce active sender/recipient policy, including inherited ERC-721 entry points, while approval and operator paths are disabled. The contract baseline does not claim production audit status.

## Alternatives considered

### ERC-1155

ERC-1155 remains a candidate if the domain requires batch operations, semi-fungible assets, or more efficient multi-asset transfers. It is not selected for the first baseline because the problem statement emphasizes unique, individually traceable assets and the MVP benefits from a narrower ownership model.

### Hyperledger Fabric

Fabric may be appropriate when organizational governance, permissioned membership, private channels, and enterprise operating control are primary. It requires a separate identity, chaincode, ordering, peer, endorsement, and operational design rather than being a drop-in replacement for the EVM Solidity baseline.

### Private Polygon or permissioned EVM

A private Polygon or other permissioned EVM network may preserve Solidity and EVM tooling while offering controlled membership and predictable operations. It still requires an approved validator/operator model, finality policy, privacy review, and operational custody decision.

## Consequences

The selected local path is reproducible and testable, and the contract source can be evaluated independently. The decision does not solve network governance, legal title, real-world identity assurance, confidential storage, key recovery, or production availability. A production deployment must not reuse local keys, local RPC assumptions, or local metadata policies.

## Revisit criteria

Revisit this ADR when the target organization selects a production network, when batch/semi-fungible asset requirements emerge, when a mobile wallet or enterprise identity protocol is approved, or when data-residency and privacy constraints require a permissioned ledger.

## References

[1]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[2]: https://eips.ethereum.org/EIPS/eip-1155 "ERC-1155 Multi Token Standard"
[3]: https://hyperledger-fabric.readthedocs.io/en/latest/ "Hyperledger Fabric documentation"
[4]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
