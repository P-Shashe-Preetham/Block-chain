# Local Compose Runbook

## Purpose and boundary

This runbook starts a **disposable local demonstration topology**: PostgreSQL, a forward-only migration job, the fail-closed FastAPI service, and the static Evidence Ledger console. It is not a production deployment, permissioned network, real identity integration, wallet/signer, transaction-submit worker, KMS/HSM, object-storage service, or backup/recovery solution.

> The Compose file deliberately leaves `CONTRACT_ADDRESS` and identity-verifier settings unset. Therefore `/readyz` remains unavailable and protected API routes fail closed. This is expected and is safer than inventing a network, credential, or signer configuration.

## Prerequisites

| Requirement | Why it is needed |
|---|---|
| Docker Engine with Docker Compose v2 | Builds/runs the local containers. |
| No `.env` or real secrets | The file uses a local-only disposable database password that must never be reused outside this topology. |
| Ports 3000 and 8000 free | Expose the static console and API health boundary on the host. |

## Start and inspect

```bash
docker compose config -q
docker compose up --build --wait
docker compose ps
curl --fail http://localhost:8000/healthz
curl -i http://localhost:8000/readyz
```

The health request must return a local API status. The readiness request must return HTTP `503` with `contract not configured`; do not suppress or reclassify this expected safeguard. Open `http://localhost:3000` to inspect the Evidence Ledger. The console will show the API audit projection as unavailable until real identity verification and the protected API preconditions are deliberately approved and configured.

<<<<<<< HEAD
## Verified Docker evidence and sandbox boundary

On 2026-08-24, the exact consolidation head built all `postgres`, `migrate`, `api`, and `web` images successfully through an authorized Docker daemon after a stale builder-cache recovery. `docker compose config -q` also passed. This is valid image-build and configuration evidence.

The bounded `docker compose up --wait` run created the disposable network, volume, and containers; PostgreSQL reached its health check. The forward-only `migrate` service then remained running without completing inside the sandbox’s bridge-network topology, so the health workflow timed out and was cleaned up with `docker compose down --volumes --remove-orphans`. A subsequent isolated migration invocation also stalled and was terminated/cleaned up. Therefore this sandbox has **not** produced full multi-container API/web runtime-health evidence. Do not call a successful image build or configuration render a successful runtime deployment.

Use a Docker-authorized account. `pnpm check:local-readiness` now verifies actual Docker daemon access in addition to Compose command availability. On this sandbox, the unprivileged socket is denied while the authorized service account can build images; a normal development host should grant the operator Docker-group or equivalent approved access rather than relying on an interactive privilege escalation.

=======
>>>>>>> origin/feat/api-fail-closed-auth-baseline
## Local data lifecycle

The `postgres_local_data` named volume is disposable development state. It contains no approved production or real identity data. Remove the topology and all local database state with:

```bash
docker compose down -v --remove-orphans
```

Do not use this command as a production retention, deletion, backup, or legal-hold mechanism. Those decisions remain blocked in the final-project decision register.

## Troubleshooting and stop conditions

| Observation | Correct action |
|---|---|
| `migrate` fails | Stop the topology, inspect sanitized container logs, fix the migration/configuration defect, and rerun from an empty local volume. Do not hand-edit the schema. |
<<<<<<< HEAD
| `migrate` remains running or `up --wait` times out | Capture `docker compose ps` and sanitized `docker compose logs`, then tear down the disposable topology. Reproduce on a Docker-capable host with functioning bridge networking before claiming application health. Do not extend timeouts indefinitely or add fictitious database/network configuration. |
| Docker command is available but daemon access is denied | Use an approved Docker-authorized account or configure the local Docker group; rerun `pnpm check:local-readiness` before Compose checks. |
=======
>>>>>>> origin/feat/api-fail-closed-auth-baseline
| `/readyz` is `503` | Expected until a real approved contract/network is configured; never add a fictitious address just to force readiness. |
| Audit route is `401`/`503` | Expected with no approved authentication provider or unavailable projection; the UI must keep its explicit unavailable state. |
| Browser console displays no data | Expected unless a separately approved, authenticated, sanitized audit source is configured. Do not inject mock operational records. |
| Local port conflict | Stop the conflicting local process or choose a deliberately reviewed port mapping; update the documented CORS/API-origin relationship together. |

## Required follow-up before a real deployment

An approved identity/provider profile, network/finality policy, deployer/multisig custody, tenant/database roles, backups/restore/reconciliation drill, persistent worker, monitoring, KMS/HSM, storage policy, privacy/legal approval, independent verifier, protected CI review, and external assurance remain required. Use [the migration template](../FINAL-PROJECT-MIGRATION-NOTES-TEMPLATE.md) for any change affecting this topology, data flow, event schema, API contract, or environment behavior.
