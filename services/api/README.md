# FastAPI service boundary

This directory contains the first **fail-closed API boundary** for the platform. It is intentionally not yet the complete asset, identity, transaction, indexer, or encrypted-storage service described by the architecture. The contract remains canonical for identity, roles, assets, ownership, lifecycle status, and access decisions.

## Current endpoints

| Endpoint | Authentication | Current behavior |
|---|---|---|
| `GET /healthz` | Public | Returns a minimal liveness response without configuration, identity, or chain data. |
| `GET /readyz` | Public | Returns `503` until a contract address is configured and the configured RPC reports the expected chain ID plus non-empty deployed bytecode. Future versions must add indexer, database, and key-service readiness checks. |
| `POST /v1/transaction-intents` | Bearer token plus `Idempotency-Key` | Validates and records an authenticated transaction intent through an injected writer. The default durable writer is unavailable and returns `503`; this route never signs, submits, replaces, confirms, or authorizes an on-chain transaction. |
| `GET /v1/audit` | Bearer token required | Reads an injected, sanitized, projection-only audit reader with bounded `limit` and explicit `projection_status` filtering. The default durable reader is unavailable and returns `503`; missing or unconfigured authentication fails closed. No raw logs, identity material, keys, or plaintext asset content are returned. |

## Configuration

`Settings.from_env()` validates environment, chain ID, RPC transport, contract address, OIDC issuer/audience/JWKS settings, and CORS origins. Local and CI may use disposable placeholders. Testnet, pilot, and production require approved secure values and reject HTTP RPC, wildcard CORS, embedded signer keys, and missing authentication trust configuration.

The current `OidcJwksTokenVerifier` is an explicit integration boundary that refuses authentication until the selected organization's OIDC/JWKS provider is implemented. Do not replace it with an unsigned JWT decoder, a wallet address header, or a token payload decode without signature, issuer, audience, expiry, algorithm, and key-rotation validation. `authorization.py` provides a deny-by-default, contract-aligned policy matrix for future route tests; it must receive fresh canonical identity, role, asset-status, ownership, and destination state rather than trusting a stale projection. `rate_limit.py` provides only a bounded process-local reference limiter; it is not wired as a production control because multi-instance enforcement, trusted client identity, abuse response, and durable metrics require an approved distributed design.

## Server entrypoint

The production ASGI import is `services.api.asgi:app`; importing it validates environment settings. Tests should use `create_app(Settings(...))` with explicit fixture settings rather than mutating process-wide environment.

## Local checks

From the repository root:

```bash
python3 -m pip install --require-hashes --requirement services/api/requirements.lock
PYTHONPATH=. python3 -m unittest discover -s services/api/tests -p 'test_*.py'
```

The API service must not be used with real identity data, production credentials, organizational asset data, or unapproved BEL data. The repository now includes a typed transaction-intent state machine, a protected intent-recording route, a sanitized audit projection route, a SQLAlchemy audit-reader adapter, and `DATABASE_URL`/`DATABASE_SSL_MODE` configuration validation for local reference and controlled integration use. The default app still injects unavailable readers/writers until approved durable session wiring, current canonical authorization policy, tenancy, and operational database controls are supplied. The intent route never signs or submits transactions. The dependency surface intentionally excludes cryptographic verifier libraries until a genuine OIDC/JWKS or wallet verifier is implemented. State-changing endpoints additionally require receipt/event confirmation, replacement/reorg handling, distributed rate limits, session invalidation, and route-level authorization.
