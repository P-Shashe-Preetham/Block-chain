# Persistence schema primitives

This directory contains the first PostgreSQL-oriented schema primitives selected by [ADR 0004](../../docs/ADR/0004-python-postgresql-durability.md). The SQLAlchemy models cover transaction intents, canonical event records, block checkpoints, and reconciliation findings. They enforce local uniqueness for subject/idempotency pairs and canonical event identities; they do not make the database authoritative for contract facts.

The models, `repository.py` adapter, initial `alembic` revisions, and `database.py` engine factory are currently an isolated reference boundary. The adapter returns identical transaction intents/events and raw-chain-log records for safe retries, rejects conflicting fingerprints or event content, records reorg uncertainty without deleting raw history, and promotes finality only within an explicit confirmation boundary. Callers must provide an explicit SQLAlchemy transaction. A disposable SQLite test proves the forward migrations create the required tables. No API route, RPC consumer worker, queue, production PostgreSQL instance, tenant policy, least-privilege database role, backup/restore process, or encryption-at-rest configuration is wired yet.

The official connection variable is `DATABASE_URL`. SQLite is accepted only for local, CI, and development validation, while non-local PostgreSQL requires an explicit secure SSL mode. The persistence lock now pins `psycopg[binary]==3.3.4` with hashes, and tests prove that the PostgreSQL SQLAlchemy dialect can be constructed lazily without a network connection while hiding parameters. This closes the reviewed driver-selection gate for local integration work; it does **not** yet prove a reachable PostgreSQL service, production driver/custody policy, or live durability.
Before testnet or pilot use, the project must add reviewed Alembic migrations against a real PostgreSQL service, PostgreSQL integration and concurrency tests, expand/contract migration procedures, tenant isolation, retention rules, transactional projection updates, backup/restore and reconciliation drills, and operational access review. The current lock uses the binary psycopg distribution for controlled integration; a production image must separately approve its PostgreSQL client/runtime and custody posture. Destructive automatic downgrades remain prohibited; recovery must use an approved forward migration or restore-and-reconcile procedure.

The persistence dependency manifest and lock are hash-checked. Local model validation uses an in-memory SQLite engine only to test metadata and constraints; SQLite is not the target shared-service database.

Local validation from the repository root:

```bash
python3 -m pip install --require-hashes --requirement services/persistence/requirements.lock
PYTHONPATH=. python3 -m unittest discover -s services/persistence/tests -p 'test_*.py'
PYTHONPATH=. python3 -m unittest discover -s scripts/tests -p 'test_persistence_migrations.py'

# Only against a disposable PostgreSQL database with throwaway credentials:
export DATABASE_URL='postgresql+psycopg://user:password@127.0.0.1:5432/platform_projection_test?sslmode=disable'
python3 -m alembic -c services/persistence/alembic.ini upgrade head
PERSISTENCE_POSTGRES_INTEGRATION=1 PYTHONPATH=. python3 -m unittest scripts.tests.test_persistence_postgres -v
```
