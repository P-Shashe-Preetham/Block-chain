# Canonical event indexer primitives

This directory contains dependency-free reference primitives for a future event indexer. The `InMemoryProjection` deduplicates events by chain, contract, transaction, log index, and event version; rejects conflicting block hashes; detects unplanned block gaps; separates finalized from unfinalized events using an explicit confirmation depth; and supports explicit rollback from a reorganization point. The projection is not a database, queue consumer, RPC client, or source of truth.

Before testnet or pilot use, an implementation must use an approved RPC provider, verify chain identity and deployed bytecode, persist raw events and projection updates transactionally, enforce unique event keys, checkpoint finalized blocks, support backfill and retry, detect reorgs, and reconcile projections against canonical contract reads. The smart contract remains authoritative for identity, role, ownership, lifecycle, and access facts.

Local validation from the repository root:

```bash
PYTHONPATH=. python3 -m unittest discover -s services/indexer/tests -p 'test_*.py'
```

No production credentials, private keys, real identity records, organizational asset data, or unapproved BEL data may be used with these reference primitives.
