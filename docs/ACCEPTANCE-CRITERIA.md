# MVP Acceptance Criteria

## Purpose

These criteria define what must be demonstrated for a controlled local or testnet MVP submission against Problem Statement 26125. Passing them does not establish production readiness, legal ownership, institutional approval, or security-audit completion.

## Identity and access

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | An administrator identity is active | The administrator registers a new subject with a non-zero DID hash | The subject is stored with an active lifecycle state, receives `USER_ROLE`, and emits `IdentityRegistered` |
| AC-02 | A subject is not registered or is inactive | Any role-controlled operation is attempted | The transaction reverts and no state change is committed |
| AC-03 | An administrator deactivates a subject | The subject previously holds user or privileged roles | The subject is inactive and privileged roles are revoked |
| AC-04 | A caller lacks the required role | The caller attempts to mint, grant, revoke, pause, or unpause | The transaction reverts |

## Asset lifecycle

| ID | Given | When | Then |
|---|---|---|---|
| AC-05 | A manager and recipient are active and non-zero asset and metadata hashes exist | The manager mints and allocates an asset | A unique ERC-721 token is created, the organizational asset ID is reserved, and `AssetMintedAndAllocated` is emitted |
| AC-06 | A non-manager, inactive manager, or duplicate asset ID is supplied | The mint operation is submitted | The transaction reverts and no token is created or registered |
| AC-07 | A recipient is inactive | A manager attempts allocation or transfer to that recipient | The transaction reverts |
| AC-08 | A manager transfers to an active recipient | The policy-aware transfer is submitted | Ownership changes once and the standard ERC-721 transfer event is emitted; an owner alone cannot transfer |
| AC-09 | An approval is requested, a non-manager calls an inherited transfer path, or an owner is inactive | The approval or transfer is attempted | The transaction reverts because standard approvals are disabled and controlled transfers are manager-only |
| AC-10 | An asset is suspended, revoked, or retired | Access or transfer is requested | The asset remains auditable, but access is denied and every ownership-changing path is blocked; only an approved lifecycle transition can restore an asset from suspension |

## Audit and verification

| ID | Given | When | Then |
|---|---|---|---|
| AC-11 | An identity, key replacement, role, mint, allocation, transfer, access decision, pause, or status operation commits | The event consumer processes the transaction | The dedicated structured event is indexed idempotently with transaction hash, block, actor, and confirmation status |
| AC-12 | A transaction reverts | The API reports operation status | The operation is reported as failed or reverted; no committed-event record claims success |
| AC-13 | An auditor verifies an asset | The auditor has the network, contract, ABI, token ID, organizational asset ID, and metadata hash | The auditor can reproduce owner, lifecycle events, access decisions, and integrity reference independently of the UI |

## Security and operations

| ID | Given | When | Then |
|---|---|---|---|
| AC-14 | The contract is paused | A state-changing identity, role, mint, transfer, or asset-status operation is attempted | The operation is blocked until an authorized active administrator unpauses it |
| AC-15 | An off-chain asset is uploaded | The payload is stored | The payload is encrypted with an AES-256 data key before IPFS/object storage, the key is controlled separately, and only an approved CID/content reference is recorded on-chain |
| AC-16 | A dependency or workflow changes | A pull request is opened | CI, dependency review, ownership review, and security checks run before merge |
| AC-17 | A deployment or employee offboarding/recovery is proposed | The release or lifecycle gate is evaluated | Contract review, key custody, network governance, privacy/legal review, recovery, asset review/reassignment, monitoring, and incident evidence are linked |

## Evidence package

A complete MVP demonstration should include the contract source, compilation output, passing unit/negative tests, deployment configuration for a disposable network, sample transaction hashes, event/indexer output, a sanitized verification walkthrough, and a statement of limitations. Do not include private keys, real identity records, or unapproved BEL data.

## References

[1]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
[2]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721: Non-Fungible Token Standard"
[3]: https://docs.openzeppelin.com/contracts/ "OpenZeppelin Contracts documentation"
[4]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
