# Canonical event indexer primitives

This directory contains dependency-free reference primitives for a future event indexer. The `InMemoryProjection` deduplicates events by chain, contract, transaction, log index, and event version; rejects conflicting block hashes; detects unplanned block gaps; separates finalized from unfinalized events using an explicit confirmation depth; and supports explicit rollback from a reorganization point. Rollback removes affected events from canonical output while retaining them as explicit uncertain records; a matching replay clears only the replayed identity, leaving orphaned records available for operator review.
The projector is not a database, queue consumer, RPC client, or source of truth. `services/indexer/consumer.py` adds a dependency-free read-only JSON-RPC scanner that bounds retries, rotates across configured providers, checks response identity, scans only through an explicit confirmation depth, and hands logs to the projector. `services/indexer/abi.py` now decodes the exact compiled `SecureAssetPlatform` event surface, including inherited ERC-721 and AccessControl events, with strict topic/data validation; unknown or malformed logs are rejected. `services/indexer/persistent.py` provides a transaction-scoped SQLAlchemy sink that persists validated checkpoints/events, derives unfinalized versus canonical status from confirmation depth, and retains uncertain events during reorg rollback. It does not start a worker, manage transactions, establish network finality, or replace canonical contract reads.

Before testnet or pilot use, an implementation must use an approved RPC provider set, verify chain identity and deployed bytecode, persist raw events and projection updates transactionally, enforce unique event keys, configure network-specific finality, support backfill and retry, detect reorgs, and reconcile projections against canonical contract reads. `services/indexer/reconcile.py` reports missing, unexpected, and mismatched records deterministically without mutating either side; repair requires an approved operator workflow. The smart contract remains authoritative for identity, role, ownership, lifecycle, and access facts.

Local validation from the repository root:

```bash
PYTHONPATH=. python3 -m unittest discover -s services/indexer/tests -p 'test_*.py'
```

No production credentials, private keys, real identity records, organizational asset data, or unapproved BEL data may be used with these reference primitives.
