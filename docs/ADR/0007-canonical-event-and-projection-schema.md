# ADR 0007: Canonical event and projection schema

- **Status:** Accepted for final-project implementation; network-specific finality and production event governance remain open
- **Date:** 2026-08-23
- **Decision owners:** Contract lead, indexer/data lead, backend lead, security lead, and verifier owner
- **Review trigger:** Before changing a contract event, adding a new event version, accepting a new network, or exposing a projection as a final user-facing state

## Context

The contract is authoritative for identity, role, ownership, lifecycle, and access facts. The indexer needs to consume the generated ABI, retain exact raw logs, build queryable projections, survive duplicate delivery and reorganization, and make drift visible without becoming a repair or authorization authority. A handwritten event schema or a projection that drops chain identity would make independent verification and safe replay unreliable.

## Decision

Every projected event is identified by:

- chain ID;
- canonical contract address;
- block number and block hash;
- transaction hash;
- log index;
- generated-ABI event name/topic; and
- explicit event schema version.

The raw RPC log is retained as an integrity reference before or atomically with its decoded projection. Identical retries are idempotent. A conflicting block hash, event identity, raw-log payload, decoder topic, or scope fails closed. Decoder names and topic hashes must be compared in CI with the generated Hardhat artifact.

Projection status is a closed set such as `unfinalized`, `canonical`, and `uncertain`. Confirmation depth is explicit and network-specific policy, not an implicit assumption. Reorganization handling removes affected derived checkpoints from canonical output, retains affected event history as uncertain, and clears uncertainty only for matching replay identity and content. Reconciliation findings are deterministic, durable, read-only evidence; repair requires a separate operator-approved workflow and may not overwrite canonical contract state.

Projection tables must retain enough information to rebuild or independently verify state: identity/role/asset/access identifiers, event identity, source block, confirmation status, raw-log integrity reference, projection version, timestamps, and non-sensitive audit context. Sensitive identity payloads, keys, authorization headers, and plaintext asset content are excluded.

Event changes require a versioned migration note describing added/removed fields, topic/signature effect, decoder compatibility, projection migration, replay/backfill range, independent-verifier behavior, and rollback or restore procedure. Contract upgradeability remains governed by ADR 0003; a new ABI or deployment does not silently replace an accepted network artifact.

## Consequences

The final project can rebuild projections, explain stale or uncertain state, and provide independent verifier evidence. Raw-log retention increases storage and privacy obligations, so retention, access control, backup, and deletion/erasure limitations require explicit governance. The model does not prove network finality, provider honesty, or production availability; those remain network and operations gates.

## Required tests

Fixtures must cover every generated canonical event, inherited ERC-721 and AccessControl event, malformed topics/data, unknown signatures, wrong contract or chain, duplicate delivery, raw-log content conflict, block-hash conflict, gaps, retry/failover, confirmation promotion, reorg uncertainty, matching replay, mismatched replay, deterministic drift, restore/rebuild, and schema-version compatibility.

## References

[1]: ../../contracts/SecureAssetPlatform.sol "Canonical SecureAssetPlatform contract"
[2]: ../../scripts/validate_indexer_abi.mjs "Generated ABI drift guard"
[3]: ../../services/indexer/abi.py "Strict canonical ABI decoder"
[4]: ../../services/indexer/persistent.py "Transaction-scoped projection sink"
[5]: ../../services/persistence/repository.py "Durable projection repository"
[6]: https://eips.ethereum.org/EIPS/eip-721 "ERC-721"
[7]: https://github.com/OpenZeppelin/openzeppelin-contracts "OpenZeppelin Contracts"
