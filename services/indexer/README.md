# Canonical event indexer primitives

This directory contains dependency-free reference primitives for a future event indexer. The `InMemoryProjection` deduplicates events by chain, contract, transaction, log index, and event version; rejects conflicting block hashes; detects unplanned block gaps; separates finalized from unfinalized events using an explicit confirmation depth; and supports explicit rollback from a reorganization point. Rollback removes affected events from canonical output while retaining them as explicit uncertain records; a matching replay clears only the replayed identity, leaving orphaned records available for operator review.
The projector is not a database, queue consumer, RPC client, or source of truth. `services/indexer/consumer.py` adds dependency-free read-only JSON-RPC scanners that bound retries, rotate across configured providers, check response identity, scan only through an explicit confirmation depth, and hand logs to the projector. `services/indexer/abi.py` decodes the exact compiled `SecureAssetPlatform` event surface, including inherited ERC-721 and AccessControl events, with strict topic/data validation; unknown or malformed logs are rejected. The `validate:indexer-abi` build-time guard compares the decoder’s event names/topic hashes with the generated Hardhat ABI, so contract event drift fails validation. `PersistentConfirmedScanner` combines that decoder with `services/indexer/persistent.py` so a caller-owned SQLAlchemy transaction retains the raw log and derived event while applying the configured confirmation boundary. It does not start a background worker, establish network finality by itself, or replace canonical contract reads.

Before testnet or pilot use, an implementation must use an approved RPC provider set, verify chain identity and deployed bytecode, persist raw events and projection updates transactionally, enforce unique event keys, configure network-specific finality, support backfill and retry, detect reorgs, and reconcile projections against canonical contract reads. `services/indexer/reconcile.py` reports missing, unexpected, and mismatched records deterministically without mutating either side; repair requires an approved operator workflow. The smart contract remains authoritative for identity, role, ownership, lifecycle, and access facts.

Local validation from the repository root:

```bash
PYTHONPATH=. python3 -m unittest discover -s services/indexer/tests -p 'test_*.py'
```

No production credentials, private keys, real identity records, organizational asset data, or unapproved BEL data may be used with these reference primitives.
