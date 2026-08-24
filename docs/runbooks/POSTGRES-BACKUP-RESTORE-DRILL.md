# PostgreSQL Backup/Restore/Reconciliation Drill

## Purpose and boundary

This drill provides **local/CI synthetic evidence** that the durable projection tables can be dumped, restored into a temporary database, and reconciled by row count. It does not establish a production backup policy, encrypted archive custody, backup retention, point-in-time recovery, legal hold, tenant isolation, disaster recovery objective, or chain-authoritative recovery procedure.

The drill is guarded against accidental use outside an explicit local/CI PostgreSQL URL. It requires `PERSISTENCE_POSTGRES_INTEGRATION=1`, `APP_ENV=local` or `ci`, and a `postgresql+psycopg://` URL pointing only to `localhost` or `127.0.0.1` with `sslmode=disable`. It writes no database URL, password, raw log, event payload, or archive content to output.

## Run

Use only a disposable test database with the existing migration head installed. The disposable drill role needs temporary `CREATEDB` permission because the script creates and deletes a randomly named restore database. Grant that permission only for the drill and revoke it immediately afterward. For the sandbox-local test database, obtain the URL from the local test setup rather than committing it:

```bash
export APP_ENV=local
export PERSISTENCE_POSTGRES_INTEGRATION=1
export DATABASE_URL='postgresql+psycopg://LOCAL_ONLY'
./scripts/drills/postgres_backup_restore_reconcile.sh
```

The script creates a temporary custom-format archive and a randomly named database. It compares counts for `transaction_intents`, `canonical_events`, `raw_chain_logs`, `block_checkpoints`, and `reconciliation_findings`, then deletes both temporary artifacts even after failure.

## Stop conditions

| Observation | Required action |
|---|---|
| Environment or URL guard rejects execution | Do not weaken the guard. Use an explicitly disposable local/CI PostgreSQL database. |
| Dump, restore, schema, or count comparison fails | Treat the drill as failed. Preserve only sanitized logs, diagnose migration/data integrity, repair, and rerun. |
| A canonical/projection mismatch is discovered | Do not "fix" chain history from PostgreSQL. Use the indexer reconciliation procedure and retain evidence. |
| Production backup need | Stop. Obtain approved retention, encryption/KMS, access-control, legal-hold, RPO/RTO, and recovery-owner decisions first. |

## Evidence record

Attach redacted command output and the result to the applicable migration/release evidence. Do not retain the generated backup archive or test database beyond the drill. The drill's row-count check is deliberately narrow; future approved operations work must add restore timing, checksum/integrity, access-control, target-environment, and canonical replay evidence.
