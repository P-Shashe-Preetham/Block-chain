# MIG-2026-002: Local Compose Topology

## 1. Change identification

| Field | Entry |
|---|---|
| Migration ID and title | `MIG-2026-002: Local Compose Topology` |
| Change type | Reproducible local integration topology, container build, runbook, and CI configuration validation. |
| Scope | Disposable PostgreSQL, forward migration, fail-closed API health boundary, and static Evidence Ledger console. |
| Excluded scope | Identity provider, signer, contract deployment, RPC network, worker, queue, KMS/HSM, object store, production database role design, backup policy, and production hosting. |
| Canonical impact | None. The topology owns no chain authority and creates no canonical state. |

## 2. Local evidence and known limitation

`sudo docker compose config -q` passed in the sandbox, and complete API/migration/web images were built and inspected. Their configured commands are the intended `uvicorn` and `nginx` entry points. The Compose topology was then started from a fresh volume.

The sandbox Docker runtime could not complete cross-container migration health validation because its kernel lacks the required bridge `iptables` raw table. Re-launching Docker without iptables avoids the engine start failure but disables the inter-container network traffic needed by PostgreSQL migration connections. This is a **sandbox container-runtime limitation**, not evidence that the source topology has passed its full health check. The topology was removed with `docker compose down -v --remove-orphans`; no local test volume remains.

## 3. Safe retry and failure behavior

The one-shot migration service has a fixed five-attempt retry loop to tolerate the official PostgreSQL image's initialization restart. It exits non-zero after the final retry; the API and static console are blocked by `service_completed_successfully`. The topology never treats a failed migration, missing contract, unavailable identity verification, or failed protected audit request as ready.

## 4. Remaining release evidence

| Requirement | Status |
|---|---|
| Compose structural validation and image build | Pass locally. |
| Full Compose health workflow in a Docker-capable environment | Pending. Must run `docker compose up --build --wait`, `curl /healthz`, verify expected `503 /readyz`, and tear down the disposable volume. |
| Synthetic local PostgreSQL backup/restore/reconciliation drill | Pass locally against the disposable sandbox database: the script restored and matched counts for transaction intents, canonical events, raw logs, checkpoints, and reconciliation findings. It must be executed only against a guarded disposable local/CI database. No production backup or retention policy is approved. |
| Worker/queue retries and metrics/log exercise | Not enabled by design; no worker/queue implementation or approval exists. |
| Production topology | Blocked pending identity, network/custody, storage/KMS, privacy/legal, monitoring, and release-owner approvals. |

## 5. References

The executable local commands and stop conditions are in [the Local Compose Runbook](../runbooks/LOCAL-COMPOSE.md). Any future topology change must use [the migration-notes template](../FINAL-PROJECT-MIGRATION-NOTES-TEMPLATE.md) and update the release gate evidence honestly.
