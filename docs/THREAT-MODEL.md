# MVP Threat Model

## Scope

This threat model covers the local and testnet MVP consisting of the `SecureAssetPlatform` contract, an eventual API/indexer/client boundary, encrypted off-chain asset metadata, administrative keys, and the audit projection. It is an engineering baseline, not a completed penetration test or independent smart-contract audit.

## Assets

| Asset | Security property | Primary concern |
|---|---|---|
| Identity registration and DID hash | Integrity, lifecycle correctness, uniqueness | Unauthorized registration, DID-hash reuse, stale identity, key loss |
| Role assignments | Integrity, least privilege | Admin compromise, escalation, inactive-role retention |
| NFT ownership, lifecycle status, and metadata hash | Integrity, authenticity, traceability | Unauthorized mint/transfer, invalid status restoration, duplicate allocation, wrong recipient |
| Administrative signing keys | Confidentiality and availability | Theft, loss, single-key compromise, inadequate recovery |
| Off-chain encrypted payloads | Confidentiality, integrity, availability | CID leakage, key compromise, unauthorized decryption, pinning loss |
| Audit events and projections | Integrity, completeness, availability | Event gaps, reorganization, projection drift, false success state |
| Repository and CI supply chain | Integrity | Malicious dependency/action, secret exposure, unreviewed workflow changes |

## Trust boundaries

1. **User/client to API:** all client claims, role labels, token IDs, and identity status are untrusted.
2. **API/indexer to blockchain:** the service submits transactions but cannot supersede canonical state.
3. **Signer/KMS to contract:** privileged transactions require approved custody and authorization.
4. **Blockchain to off-chain storage:** a CID or hash proves a reference/integrity relationship; it does not grant confidentiality or guarantee availability.
5. **Contract events to database projection:** events are inputs to a recoverable read model; a database must not rewrite ownership truth.
6. **CI/dependency supply chain:** workflows, packages, compiler versions, and generated artifacts require review and provenance.

## Abuse cases and controls

| ID | Abuse case | Control in MVP baseline | Evidence still required |
|---|---|---|---|
| TM-01 | Outsider attempts to mint or allocate an asset | `MANAGER_ROLE`, active-manager check, negative test | Fuzz tests, deployment-role review, multisig policy |
| TM-02 | Inactive identity receives or transfers an asset | Active recipient/owner/operator checks and role revocation | Full approval/operator test matrix |
| TM-03 | Owner or approved ERC-721 operator bypasses platform transfer policy | Standard approvals are disabled; `transferAsset`, `transferFrom`, and four-argument `safeTransferFrom` require an active `MANAGER_ROLE`; `_update` enforces active endpoints | Review every inherited/extension path and add deployment-level approval tests |
| TM-04 | A single administrator key is compromised | Documentation blocks production use of a single unmanaged key | Institutional custody, multisig, rotation, recovery drill |
| TM-05 | Oversized or malicious metadata input creates gas/indexing pressure | MVP contract stores a fixed-size `bytes32` metadata hash | URI/hash policy and off-chain input validation |
| TM-06 | A revoked or retired asset is accessed or transferred | Explicit asset status blocks access/transfer and only permits approved lifecycle transitions | Stateful lifecycle fuzzing and independent policy review |
| TM-07 | Public CID exposes confidential asset data | Architecture requires encryption before off-chain storage | Envelope-encryption implementation, KMS/HSM controls, revocation test |
| TM-08 | Reverted transactions are mistaken for immutable audit entries | `requestAccess` commits a structured `AccessDecision` for granted or denied outcomes; contract events represent committed changes; API must expose pending/reverted status | Indexer and transaction-status implementation |
| TM-09 | Chain reorganization causes stale ownership projection | Architecture requires confirmation and reconciliation | Indexer replay/reorg tests and monitoring |
| TM-10 | Role grant targets an unregistered or inactive subject | `grantRole` validates registration and active status | Comprehensive role graph and revocation tests |
| TM-11 | CI action or dependency is tampered with | Pinned Scorecard action, Dependabot, frozen pnpm lockfile, pinned pnpm toolchain, least-privilege workflow permissions | Dependency review, provenance policy, secret scanning |

## Security invariants

The following invariants must hold in every contract test and deployment review:

- An address that is not registered and active cannot receive a role-controlled asset.
- A DID-hash commitment cannot be registered to more than one identity address.
- An inactive identity cannot mint, transfer, receive, or exercise privileged contract actions.
- A non-manager cannot mint or allocate an asset.
- Every token ID is unique and has one canonical owner at a time.
- A suspended, revoked, or retired asset cannot be accessed or transferred; revoked and retired assets cannot be restored to active status.
- Every ownership-changing transaction emits a standard ERC-721 transfer event and a policy event where appropriate.
- Role revocation and identity deactivation cannot silently leave privileged capabilities active.
- Contract pause blocks state-changing operations that could affect identity, roles, or assets.
- Off-chain projections never report a confirmed success before the transaction and required event are verified.

## Residual risks

The MVP does not solve real-world identity assurance, private-key recovery, legal title, compromised administrator behavior, public-network privacy, data deletion from immutable ledgers, or availability of external storage. These risks require organizational governance and operational controls beyond the contract.

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[2]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[3]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[4]: https://ipfs.tech/ "IPFS documentation and project site"
