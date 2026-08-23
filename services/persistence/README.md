# Persistence schema primitives

This directory contains the first PostgreSQL-oriented schema primitives selected by [ADR 0004](../../docs/ADR/0004-python-postgresql-durability.md). The SQLAlchemy models cover transaction intents, canonical event records, block checkpoints, and reconciliation findings. They enforce local uniqueness for subject/idempotency pairs and canonical event identities; they do not make the database authoritative for contract facts.

The models, `repository.py` adapter, and initial `alembic` revision are currently an isolated reference boundary. The adapter returns identical transaction intents/events for safe retries and rejects conflicting fingerprints or event content; callers must provide an explicit SQLAlchemy transaction. A disposable SQLite test proves the initial migration creates the required tables. No API route, RPC consumer, queue, production PostgreSQL instance, tenant policy, least-privilege database role, backup/restore process, or encryption-at-rest configuration is wired yet.
Before testnet or pilot use, the project must add reviewed Alembic migrations against PostgreSQL, PostgreSQL integration tests, expand/contract migration procedures, tenant isolation, retention rules, transactional projection updates, backup/restore and reconciliation drills, and operational access review. Destructive automatic downgrades remain prohibited; recovery must use an approved forward migration or restore-and-reconcile procedure.

The persistence dependency manifest and lock are hash-checked. Local model validation uses an in-memory SQLite engine only to test metadata and constraints; SQLite is not the target shared-service database.

Local validation from the repository root:

```bash
python3 -m pip install --require-hashes --requirement services/persistence/requirements.lock
PYTHONPATH=. python3 -m unittest discover -s services/persistence/tests -p 'test_*.py'
PYTHONPATH=. python3 -m unittest discover -s scripts/tests -p 'test_persistence_migrations.py'
```
