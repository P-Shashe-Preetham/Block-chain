# ADR 0004: Python/PostgreSQL Durability Boundary

- **Status:** Accepted as the implementation direction for the next durable-service phase; production approval remains open
- **Date:** 2026-08-23
- **Decision owners:** Maintainers, backend lead, data/indexer lead, security lead, privacy lead, and contract reviewer
- **Review trigger:** Before adding production database credentials, before testnet integration, or if the service language/tenant model changes

## Context

The repository now contains local reference state machines and an in-memory canonical event projection, but no durable transaction store, indexer database, migration history, queue, or audit read model. The smart contract remains authoritative for identity, role, ownership, lifecycle, and access facts. Durable off-chain components must be recoverable projections and must not silently turn stale data into authorization truth.

The API and indexer baselines are Python-based. A database choice should therefore avoid introducing a second schema language or runtime until the service boundary is real, while still supporting PostgreSQL constraints, migrations, least-privilege roles, transactional idempotency, and operational restore procedures.

## Decision

Use **PostgreSQL** with **SQLAlchemy 2.x** for Python data access and **Alembic** for reviewed schema migrations when durable API/indexer implementation begins. Use the Python-native path for transaction intents, idempotency records, raw canonical event records, confirmation state, projection tables, reconciliation findings, and privacy-safe audit views. Use `psycopg` or an approved PostgreSQL driver only after its exact version, hash-locked dependency set, and deployment support are reviewed.

The database is a recoverable read model and workflow store, not the authorization source of truth. State-changing authorization must use fresh contract reads or an explicitly approved confirmation-aware policy. Every canonical event record must retain chain ID, contract address, block number/hash, transaction hash, log index, event schema version, raw-event integrity reference, and projection status. Unique constraints must enforce event identity and idempotency keys. Transaction-intent records must bind the authenticated subject and request fingerprint; conflicting key reuse must fail closed.

Migrations must use an expand/contract approach, be reviewed through protected pull requests, and be tested against a disposable PostgreSQL instance before integration. Rollback means a reviewed forward migration or restore-and-reconcile procedure; destructive automatic down-migrations are not an incident response plan. Database credentials, encryption keys, and connection strings must remain outside source, browser code, logs, and manifests.

## Alternatives considered

### Prisma with TypeScript

Prisma remains viable if the backend or indexer moves to a TypeScript service. It is not selected for the present direction because the implemented API and indexer boundaries are Python-based and a second ORM/runtime would duplicate schema ownership before those services exist.

### SQLModel or a lightweight query layer

A lighter Python layer may be considered for small read-only components, but it does not remove the need for explicit migrations, constraints, transactions, pooling, and restore evidence. It should not become an implicit substitute for the selected durable boundary without an ADR update.

### SQLite

SQLite is suitable for isolated local tests only. It is not the target shared-service store because concurrent workers, operational access control, HA, backup, and tenant isolation require PostgreSQL evidence.

## Consequences

The next implementation phase can share typed Python models and a single migration ownership model across API and indexer services. PostgreSQL constraints can enforce idempotency and event uniqueness close to the data. The decision does not provide a database implementation, tenant policy, KMS integration, queue, HA design, backup/restore drill, or privacy approval. Those remain explicit gates in the remediation register.

## Revisit criteria

Revisit this ADR if the API/indexer language changes, if the target organization requires a different approved database, if tenant isolation requires separate databases or schemas, if a managed service changes the driver/custody model, or if independent performance and recovery testing shows the design is insufficient.

## References

[1]: https://www.postgresql.org/docs/current/ "PostgreSQL documentation"
[2]: https://docs.sqlalchemy.org/en/20/ "SQLAlchemy 2.x documentation"
[3]: https://alembic.sqlalchemy.org/en/latest/ "Alembic documentation"
