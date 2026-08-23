# Final Project Data Dictionary

## Scope and authority

This dictionary records only data structures that exist in the current contract or project-owned service boundaries. It is a design and evidence artifact, not an approval for real identity records, production custody, legal retention, testnet use, or database activation. The canonical source for contract facts is `contracts/SecureAssetPlatform.sol`; indexed records are recoverable projections, and browser/API data is never a replacement authority. The event-version and reorg rules are governed by [ADR 0007](ADR/0007-canonical-event-and-projection-schema.md), while external data-custody decisions remain blocked in the [decision register](FINAL-PROJECT-DECISION-REGISTER.md).

| Data plane | Authority | Permitted purpose | Explicitly not permitted |
|---|---|---|---|
| Canonical EVM state and logs | Deployed `SecureAssetPlatform` at an approved chain/address | Identity-reference lifecycle, role state, token ownership, asset lifecycle, access decisions, and emergency state | Plaintext identity documents, private keys, raw credentials, confidential asset data, legal title evidence, or a production assurance claim |
| Derived projection | Confirmed ABI-decoded logs plus checkpoints | Searchable audit evidence, reconciliation, operational status, and read models | Authorization override, irreversible legal record, reorg concealment, raw user-data warehouse, or independent chain proof |
| API intent store | Authenticated request/idempotency boundary | Intent replay protection and workflow correlation | Signing, wallet custody, transaction submission, confirmation, authorization decision, or execution guarantee |
| Storage reference boundary | Declared metadata, ciphertext envelope, and non-secret key authorization metadata | Local crypto/classification policy testing and future adapter contract | Key generation/storage/release, plaintext-content service, DLP, malware scanning, object storage, or regulated-data acceptance |

## Shared syntax and lifecycle vocabulary

| Term | Representation | Validity/meaning |
|---|---|---|
| EVM address | `0x` plus 40 hexadecimal characters; normalized lower-case in projections | Account or contract identifier. Zero address is rejected where contract policy requires a subject. |
| Hash / `bytes32` | `0x` plus 64 hexadecimal characters | Fixed-length opaque commitment/reference. It is not assumed to be a DID, filename, personal identifier, or document hash without an approved data-owner profile. |
| Transaction hash | `0x` plus 64 hexadecimal characters | Chain transaction identifier retained in a projection/raw log. |
| Token ID | Unsigned integer | Contract ERC-721 token identifier; `0` is valid because minting starts from `_nextTokenId = 0`. The storage key-release prototype separately requires `asset_id >= 1`; it is not mapped to contract token IDs. |
| Block number | Non-negative integer | Height at which a log was observed. A finality policy is not selected, so numbers alone do not prove finality. |
| Event key | `(chain_id, contract_address, transaction_hash, log_index, event_version)` | Unique versioned projection identity. `event_version` begins at `1` and must change through the ADR 0007 migration process, not silently. |
| Projection status | `canonical`, `unfinalized`, or `uncertain` | `canonical` is derived only under configured confirmation rules; `unfinalized` is below the confirmation boundary; `uncertain` denotes affected/replay-required derived history. No status is an authorization result. |
| Transaction status | `requested`, `signed`, `submitted`, `pending`, `confirmed`, `failed`, `reverted`, `replaced`, or `unknown` | Closed workflow vocabulary. Only `requested` is created by the current intent API. Submission-related statuses require a transaction hash; no current API advances an intent beyond recording it. |
| Time | Timezone-aware `datetime` in service storage; `uint64 block.timestamp` in the contract | Timestamps are evidence/expiry inputs, not a network-finality guarantee or legal retention clock. |

## Canonical contract state

| Field or mapping | Solidity type | Key / visibility | Meaning | Placement rule |
|---|---|---|---|---|
| `MANAGER_ROLE` | `bytes32` | Public constant | Hash of `MANAGER_ROLE`; manager administration and controlled asset lifecycle authority. | Canonical role identifier only. Do not mirror a browser-supplied role label as authorization. |
| `AUDITOR_ROLE` | `bytes32` | Public constant | Hash of `AUDITOR_ROLE`; participates in default read-access policy when no explicit rule exists. | Canonical role identifier only. |
| `USER_ROLE` | `bytes32` | Public constant | Hash of `USER_ROLE`; baseline identity-associated role. | Canonical role identifier only. |
| `IdentityProfile.didHash` | `bytes32` | `identityRegistry[subject]` | Opaque identity commitment/reference; the root administrator is initialized with zero hash. | No raw DID, DID document, VC, certificate, or personal data is on-chain. |
| `IdentityProfile.isActive` | `bool` | `identityRegistry[subject]` | Identity lifecycle flag used by protected contract paths. | Derived views may display it, but current contract state wins. |
| `IdentityProfile.registeredAt` | `uint64` | `identityRegistry[subject]` | Registration block timestamp; zero also signals that a non-root subject has not been registered. | Do not treat as human identity-verification time. |
| `identityByDidHash` | `mapping(bytes32 => address)` | Public mapping | Reverse uniqueness lookup for nonzero DID-hash commitments. | Do not infer a real-world identity from this mapping. |
| `assetIdExists` | `mapping(bytes32 => bool)` | Public mapping | Prevents duplicate opaque asset-ID commitments. | Does not establish physical-asset uniqueness or legal title. |
| `assetIdByToken` | `mapping(uint256 => bytes32)` | Public mapping | Opaque asset commitment associated with a token. | Not a plaintext inventory number or physical binding proof. |
| `assetMetadataHash` | `mapping(uint256 => bytes32)` | Public mapping | Opaque metadata commitment supplied at mint. | Must not contain plaintext metadata or a decryption key. |
| `assetStatus` | `mapping(uint256 => AssetStatus)` | Public mapping | Lifecycle state: `ACTIVE=0`, `SUSPENDED=1`, `REVOKED=2`, `RETIRED=3`. | Default mapping value is active; event/ownership existence must be checked before interpreting an unmapped token. |
| `accessRules` | `mapping(tokenId => mapping(action => mapping(requester => AccessRule)))` | Public mapping | Per-token/action/requester override. | The action is an opaque `bytes32`, not an unconstrained human-readable permission string. |
| `AccessRule.exists` | `bool` | `accessRules[...]` | Signals explicit override. | Absence falls back to owner/manager/auditor policy in `requestAccess`. |
| `AccessRule.allowed` | `bool` | `accessRules[...]` | Explicit grant or deny when rule exists. | It still depends on active identity, active asset, and unexpired rule. |
| `AccessRule.expiresAt` | `uint64` | `accessRules[...]` | Expiry timestamp; zero means no expiry. | It is a block-time policy value, not a retention date. |

## Canonical event schema

The strict decoder accepts only the 17 event fragments below. It serializes decoded `address` and `bytes32` values as normalized `0x` strings, `bool` as `true`/`false`, and unsigned integers as base-10 strings. Unknown signatures, mismatched topic counts, malformed words, overflow, or contract-address mismatch are rejected before projection.

| Event | Decoder fields in declared order | Use and data caution |
|---|---|---|
| `IdentityRegistered` | `subject: address [indexed]`, `didHash: bytes32 [indexed]` | Records opaque identity-reference registration; never substitute for an approved DID/VC proof. |
| `IdentityStatusChanged` | `subject: address [indexed]`, `isActive: bool` | Records activation/offboarding-related state change. |
| `IdentityKeyReplaced` | `oldSubject: address [indexed]`, `newSubject: address [indexed]`, `newDidHash: bytes32 [indexed]` | Records contract-key replacement; no recovery authority or real-world identity proof is embedded. |
| `IdentityOffboarded` | `subject: address [indexed]`, `reason: bytes32 [indexed]` | Records opaque offboarding reason commitment, not a human-readable disciplinary/HR record. |
| `AssetMintedAndAllocated` | `tokenId: uint256 [indexed]`, `owner: address [indexed]`, `assetId: bytes32 [indexed]`, `metadataHash: bytes32` | Records token allocation and opaque commitments. |
| `AssetStatusChanged` | `tokenId: uint256 [indexed]`, `status: uint8`, `actor: address [indexed]` | Records lifecycle transition, whose allowed graph is contract-defined. |
| `AccessRuleSet` | `tokenId: uint256 [indexed]`, `action: bytes32 [indexed]`, `requester: address [indexed]`, `allowed: bool`, `expiresAt: uint64`, `actor: address` | Records one exact policy override, not a general ACL export. |
| `AccessDecision` | `requester: address [indexed]`, `tokenId: uint256 [indexed]`, `action: bytes32 [indexed]`, `granted: bool` | Records a request result, including denials; it does not release encrypted content or keys. |
| `EmergencyStateChanged` | `paused: bool` | Application emergency-state event. |
| `Transfer` | `from: address [indexed]`, `to: address [indexed]`, `tokenId: uint256 [indexed]` | Inherited ERC-721 event. Approval methods are disabled, but transfer events remain relevant to controlled manager paths. |
| `Approval` | `owner: address [indexed]`, `approved: address [indexed]`, `tokenId: uint256 [indexed]` | Inherited ERC-721 fragment retained for strict ABI completeness; contract policy disables new approval calls. |
| `ApprovalForAll` | `owner: address [indexed]`, `operator: address [indexed]`, `approved: bool` | Inherited ERC-721 fragment retained for ABI completeness; contract policy disables new approval-for-all calls. |
| `RoleAdminChanged` | `role: bytes32 [indexed]`, `previousAdminRole: bytes32 [indexed]`, `newAdminRole: bytes32 [indexed]` | Inherited AccessControl administration evidence. |
| `RoleGranted` | `role: bytes32 [indexed]`, `account: address [indexed]`, `sender: address [indexed]` | Inherited AccessControl grant evidence. |
| `RoleRevoked` | `role: bytes32 [indexed]`, `account: address [indexed]`, `sender: address [indexed]` | Inherited AccessControl revocation evidence. |
| `Paused` | `account: address` | Inherited Pausable event. |
| `Unpaused` | `account: address` | Inherited Pausable event. |

## Raw-log, projection, and reconciliation records

| Record | Field set | Storage interpretation | Exposure rule |
|---|---|---|---|
| `RawChainLogRecord` | `event_id`, `chain_id`, `contract_address`, `transaction_hash`, `log_index`, `block_number`, `block_hash`, `topics_json`, `data_hex`, `observed_at` | Append-only raw retrieval evidence keyed by derived event ID. `topics_json` and `data_hex` are raw ABI material. | **Never** return from the current audit API or a browser console by default. Raw log access needs an approved operator/export policy. |
| `CanonicalEventRecord` | `id`, event key fields, `block_number`, `block_hash`, `event_name`, `payload_json`, `projection_status`, `observed_at` | ABI-decoded recoverable view. Uniqueness is event key including `event_version`. `payload_json` contains decoder strings, not an authority grant. | Current audit API returns only a redacted subset and only after authentication succeeds. |
| `BlockCheckpoint` | `chain_id`, `block_number`, `block_hash`, `finalized`, `observed_at` | Observed chain continuity/finality tracking. | Operational record; do not treat `finalized=true` as an approved network finality policy. |
| `ReconciliationFinding` | `id`, `subject_key`, `finding_kind`, `canonical_value`, `projected_value`, `status`, `created_at`, `resolved_at` | Deterministic drift evidence. The repository does not perform automatic repair. | Operator-facing future evidence; values must be redacted/scoped before any UI or export. |
| `TransactionIntent` | `id`, `subject_key`, `idempotency_key`, `request_fingerprint`, `status`, `transaction_hash`, `created_at`, `updated_at` | Recoverable API workflow record; uniqueness is `(subject_key, idempotency_key)`. | Never represents chain success. `transaction_hash` is null for the implemented requested-only path. |

## API contracts and redaction

| Contract | Inbound fields | Outbound fields | Guardrails |
|---|---|---|---|
| `POST /v1/transaction-intents` | Required `Idempotency-Key`; JSON `operation` (`1..64`, lower snake-case) and up to 32 string `arguments`; authenticated principal is server-derived | `intent_id`, `status`, `chain_id`, `contract_address`, `idempotency_key`, `request_fingerprint`, `created_at`, `updated_at`, `on_chain_submission=false` | Default writer is unavailable without both explicit database and contract settings. The handler cannot sign, submit, replace, confirm, or authorize a transaction. |
| `GET /v1/audit` | `limit` in `1..100`; optional `projection_status`; authenticated principal is server-derived | `projection_only=true` plus `event_id`, `chain_id`, `contract_address`, `transaction_hash`, `log_index`, `block_number`, `event_name`, `projection_status` | Raw topics/data, decoded payload, identity documents, keys, plaintext content, subject profiles, and reconciliation fields are intentionally excluded. Default reader fails closed when unavailable. |
| Request metadata | Optional `X-Request-ID` | Same `X-Request-ID`, `Cache-Control: no-store`, `nosniff`, `no-referrer`, restrictive CSP | Control characters and over-128-character request IDs are rejected. Request IDs are correlation metadata, not identity proof. |

## Storage-reference records and allowed placement

| Record / field | Allowed form | Allowed location | Prohibited content or handling |
|---|---|---|---|
| `PayloadDescriptor.object_id` | Nonempty opaque object identifier | Future storage-adapter request metadata | File path, user identifier, or sensitive document title unless approved data policy allows it. |
| `PayloadDescriptor.payload_class` | `public_metadata` or `encrypted_asset_ciphertext` only | Classification gate | `identity_document`, `biometric`, `secret`, `regulated`, and `unknown` classes are rejected. |
| `PayloadDescriptor.size_bytes` | `0..25 MiB` declared integer | Classification gate | Not a malware/DLP result or resource reservation. |
| `PayloadDescriptor.content_type` | Nonempty declared type | Classification gate | Content inspection claim or trust decision. |
| `PayloadDescriptor.encrypted` | `true` required for `encrypted_asset_ciphertext` | Classification gate | Encryption assurance beyond declared metadata. |
| `EncryptedBlob` | `version=1`, `algorithm=AES-256-GCM`, 12-byte nonce, authenticated ciphertext, associated data; serialized base64url fields | Local test/reference boundary or approved future object storage | Plaintext, 32-byte key, key wrapping, key lifecycle, or production key release. |
| `KeyReference` | `key_id`, positive `version`, nonempty `purpose` | Non-secret future KMS-adapter request/authorization metadata | Actual key bytes, key handles usable by untrusted clients, or evidence of KMS approval. |
| `AccessDecisionEvidence` | Prototype `asset_id`, `action`, `subject_key`, `decision`, `decision_block`, optional `expires_at` | Key-release policy input only | A claimed canonical chain read unless a future verifier produces it. |
| `KeyReleaseAuthorization` | `KeyReference`, asset/action/subject, evidence block, audit request ID | Non-secret output passed to a separate future KMS/HSM adapter | Decrypted data, data-encryption key, KMS operation result, or release assurance. |

## Data-placement prohibition matrix

| Data category | Chain state/logs | Projection/raw log DB | API audit/intent response | Browser storage | Local crypto reference |
|---|---:|---:|---:|---:|---:|
| Plaintext identity document, biometric, credential, secret, or regulated data | Prohibited | Prohibited pending policy | Prohibited | Prohibited | Prohibited by classification gate |
| Private key, signing seed, KMS/HSM key, or decryptable key material | Prohibited | Prohibited | Prohibited | Prohibited | Prohibited; caller-supplied test key is never persisted |
| Opaque `bytes32` commitment | Allowed where contract schema defines it | Allowed as decoded/raw evidence | Excluded from current audit response payload | Display only if future redaction policy permits | Not applicable |
| Transaction/block/log identifiers | Allowed | Allowed | Sanitized audit subset allowed | Display-only with status context | Not applicable |
| Declared ciphertext envelope | Prohibited from contract schema | No production adapter currently | Prohibited | Prohibited | Allowed only as local reference/test data |
| Authorization decision metadata | Contract event can record `granted` | Derived/retained under projection policy | Audit route does not expose payload decision detail | Future display must distinguish status and authority | Key-release policy consumes metadata only |

## Change-control requirements

Any contract-event, projection, API, storage, environment, serialization, or data-placement change must first use the [migration note template](FINAL-PROJECT-MIGRATION-NOTES-TEMPLATE.md). It must state canonical impact, schema/version change, backfill/replay behavior, redaction/privacy impact, compatibility test, rollback or forward-only treatment, source-ledger impact, and release-gate evidence. No field may be repurposed to hold unapproved sensitive data.

## References

[1]: ../contracts/SecureAssetPlatform.sol "Canonical Solidity contract"
[2]: ../services/indexer/abi.py "Strict generated-ABI event decoder"
[3]: ../services/persistence/models.py "SQLAlchemy durable record schema"
[4]: ../services/api/app.py "FastAPI boundary and response redaction"
[5]: ../services/api/intents.py "Transaction-intent contract"
[6]: ../services/storage/crypto.py "AES-GCM reference envelope"
[7]: ../services/storage/classification.py "Declared payload-classification gate"
[8]: ../services/storage/key_release.py "Non-secret key-release authorization policy"
