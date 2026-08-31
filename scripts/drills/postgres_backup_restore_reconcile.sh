#!/usr/bin/env bash
# Local final-project drill: verifies a synthetic PostgreSQL projection backup/restore without copying or exposing production data.
set -euo pipefail

if [[ "${PERSISTENCE_POSTGRES_INTEGRATION:-}" != "1" ]]; then
  echo "Refusing backup/restore drill: set PERSISTENCE_POSTGRES_INTEGRATION=1 for an explicitly disposable database." >&2
  exit 2
fi

if [[ "${APP_ENV:-local}" != "local" && "${APP_ENV:-}" != "ci" ]]; then
  echo "Refusing backup/restore drill outside APP_ENV=local or APP_ENV=ci." >&2
  exit 2
fi

if [[ -z "${DATABASE_URL:-}" || ! "${DATABASE_URL}" =~ ^postgresql\+psycopg://[^@]+@(127\.0\.0\.1|localhost):[0-9]+/[^?]+\?sslmode=disable$ ]]; then
  echo "Refusing backup/restore drill: DATABASE_URL must be an explicit local psycopg URL with sslmode=disable." >&2
  exit 2
fi

source_url="${DATABASE_URL/postgresql+psycopg:/postgresql:}"
base_url="${source_url%/*}"
query_suffix=""
if [[ "${source_url}" == *\?* ]]; then
  query_suffix="?${source_url#*\?}"
fi

target_database="platform_restore_drill_$$_$RANDOM"
target_url="${base_url}/${target_database}${query_suffix}"
archive_path="$(mktemp --suffix=.dump)"

cleanup() {
  rm -f "${archive_path}"
  dropdb --if-exists --maintenance-db="${source_url}" "${target_database}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Creating a local-only custom-format projection backup."
pg_dump --format=custom --no-owner --no-privileges --file="${archive_path}" --dbname="${source_url}"
createdb --maintenance-db="${source_url}" "${target_database}"
pg_restore --exit-on-error --no-owner --no-privileges --dbname="${target_url}" "${archive_path}"

for table_name in transaction_intents canonical_events raw_chain_logs block_checkpoints reconciliation_findings; do
  source_count="$(psql --no-align --tuples-only --quiet --dbname="${source_url}" -c "SELECT COUNT(*) FROM ${table_name};" | tr -d '[:space:]')"
  restored_count="$(psql --no-align --tuples-only --quiet --dbname="${target_url}" -c "SELECT COUNT(*) FROM ${table_name};" | tr -d '[:space:]')"
  if [[ "${source_count}" != "${restored_count}" ]]; then
    echo "Restore reconciliation mismatch for ${table_name}: source=${source_count}, restored=${restored_count}." >&2
    exit 1
  fi
  echo "Restore reconciliation passed for ${table_name}: ${source_count} rows."
done

echo "Local-only PostgreSQL backup/restore/reconciliation drill passed; temporary archive and database will be removed."
