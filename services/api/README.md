# FastAPI service boundary

This directory contains the first **fail-closed API boundary** for the platform. It is intentionally not yet the complete asset, identity, transaction, indexer, or encrypted-storage service described by the architecture. The contract remains canonical for identity, roles, assets, ownership, lifecycle status, and access decisions.

## Current endpoints

| Endpoint | Authentication | Current behavior |
|---|---|---|
| `GET /healthz` | Public | Returns a minimal liveness response without configuration, identity, or chain data. |
| `GET /readyz` | Public | Returns `503` until a contract address is configured. Future versions must add RPC, indexer, database, and key-service readiness checks. |
| `GET /v1/audit` | Bearer token required | Returns `501` until the canonical event indexer and audit projection exist. Missing or unconfigured authentication fails closed. |

## Configuration

`Settings.from_env()` validates environment, chain ID, RPC transport, contract address, OIDC issuer/audience/JWKS settings, and CORS origins. Local and CI may use disposable placeholders. Testnet, pilot, and production require approved secure values and reject HTTP RPC, wildcard CORS, embedded signer keys, and missing authentication trust configuration.

The current `OidcJwksTokenVerifier` is an explicit integration boundary that refuses authentication until the selected organization's OIDC/JWKS provider is implemented. Do not replace it with an unsigned JWT decoder, a wallet address header, or a token payload decode without signature, issuer, audience, expiry, algorithm, and key-rotation validation.

## Server entrypoint

The production ASGI import is `services.api.asgi:app`; importing it validates environment settings. Tests should use `create_app(Settings(...))` with explicit fixture settings rather than mutating process-wide environment.

## Local checks

From the repository root:

```bash
python3 -m pip install --require-hashes --requirement services/api/requirements.lock
PYTHONPATH=. python3 -m unittest discover -s services/api/tests -p 'test_*.py'
```

The API service must not be used with real identity data, production credentials, organizational asset data, or unapproved BEL data. The repository now includes a typed transaction-intent state machine with idempotency-conflict protection for local reference use. The dependency surface intentionally excludes cryptographic verifier libraries until a genuine OIDC/JWKS or wallet verifier is implemented. The next implementation phase must persist the state machine in a durable database with unique constraints, expiry/retention, authenticated ownership, receipt/event confirmation, replacement/reorg handling, privacy-safe audit projection, rate limits, session invalidation, and route-level authorization before exposing business endpoints.
