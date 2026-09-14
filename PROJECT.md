# Project: SIH26125 Blockchain Secure Platform Production Transformation

## Architecture
The platform is an enterprise-grade secure digital asset passport and decentralized access control system adhering strictly to the Ponytail philosophy (minimalist, YAGNI, zero bloat).

```
+-------------------------------------------------------------------------+
|                        Web Console (apps/web)                           |
|        Lean React 19 + Vite Console (Identity, Access, Passports)       |
|                            Port: 3000                                   |
+------------------------------------+------------------------------------+
                                     | Reverse Proxy (/api) & EIP-1193
                                     v
+------------------------------------+------------------------------------+
|                       FastAPI Backend (services/api)                    |
|       Lean Async Python (EIP-191 Auth, RBAC, Asset API, Audit)          |
|                            Port: 8000                                   |
+------------------------------------+------------------------------------+
                                     | Web3 / JSON-RPC
                                     v
+------------------------------------+------------------------------------+
|                      EVM Node & Smart Contracts                         |
|      Hardhat Node (Port 8545) + Hardened SecureAssetPlatform.sol        |
|          ERC-721 Passports + DID Identity + On-chain RBAC Rules         |
+-------------------------------------------------------------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Ruthless Bloat Deletion | Delete zombie directories (`block/`, `client/`, `archive/`, `SIH...zip`, obsolete markdown) | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Dead Code Cleanup | Remove dead mock blockchain (`AssetChainContext`, `PeerSyncContext`), 3D splines (`BlockchainChain3D`), dead JS files, Manus/Map modals | M1 | Survey (Spec Miner) |
| 3 | Conflict Markers Cleanup | Clean Git merge conflict markers in shell scripts and docs | M1 | Survey (Explorer 2) |
| 4 | Smart Contract Consolidation | Consolidate core logic into hardened `SecureAssetPlatform.sol` and remove 5 redundant Open Banking contracts | M2 | ORIGINAL_REQUEST §R2 |
| 5 | EVM Security Vulnerability Fixes | Fix SEC-01 (`replaceIdentityKey`), SEC-02 (`approveTransfer`), and SEC-03 (Admin governance) | M2 | Survey (Explorer 2) |
| 6 | EVM Gas Optimization | Replace storage-based audit logging with indexed EVM events (~98.9% gas reduction) and optimize execution gas | M2 | ORIGINAL_REQUEST §Ponytail |
| 7 | Contract Test Suite Stabilization | Fix orphaned `test/IdentityRegistry.test.ts` and ensure `npx hardhat test` passes 100% with zero failures | M2 | ORIGINAL_REQUEST §Criteria |
| 8 | Contract Deployment Pipeline | Ensure `scripts/deploy.ts` outputs clean `deployments/local.json` with contract addresses and ABI | M2 | Survey (Explorer 1 & 2) |
| 9 | Backend Fatal Bug Fix | Fix `auth.py` double `Depends(...)` preventing API startup | M3 | Survey (Explorer 1) |
| 10 | Backend Bloat & Route Pruning | Delete mock bank routes (Apex/Beacon/Crest), TSP approvals, duplicate consent/access routes | M3 | ORIGINAL_REQUEST §R1 |
| 11 | Backend Dependency Minimization | Consolidate to single minimal `requirements.txt` (6 direct packages: fastapi, uvicorn, pydantic, httpx, eth-account, web3) | M3 | ORIGINAL_REQUEST §Ponytail |
| 12 | Core Identity API | `POST /api/identity/register`, `POST /api/identity/verify`, `GET /api/identity/status/{wallet}` | M3 | ORIGINAL_REQUEST §R2 |
| 13 | Core Auth API | EIP-191 challenge/nonce (`POST /api/auth/nonce`, `POST /api/auth/login`, `GET /api/auth/me`) with lightweight HMAC JWT | M3 | ORIGINAL_REQUEST §R2 |
| 14 | Core Asset Passport API | `POST /api/assets/mint`, `GET /api/assets/{wallet}`, `POST /api/auth/hash-metadata` linked to ERC-721 | M3 | ORIGINAL_REQUEST §R2 |
| 15 | Core RBAC & Consent API | `POST /api/rbac/request-access`, `POST /api/rbac/grant-consent`, `POST /api/rbac/revoke-consent/{id}`, `GET /api/rbac/consents/{wallet}` | M3 | ORIGINAL_REQUEST §R2 |
| 16 | Core Audit & Incidents API | `GET /api/audit/logs`, `GET /api/audit/incidents` querying indexed EVM events / access logs | M3 | ORIGINAL_REQUEST §R2 |
| 17 | Frontend Dependency Pruning | Remove `three`, `@react-three/*`, `framer-motion`, `recharts`, carousels, and 20+ unused Radix packages | M4 | ORIGINAL_REQUEST §R3 |
| 18 | Frontend Build & Type Fixes | Fix `tsconfig.app.json` types constraint and `RoleDashboard.tsx` event parameter types so `pnpm run build` passes | M4 | ORIGINAL_REQUEST §Criteria |
| 19 | Lean Unified Frontend Console | Promote `RoleDashboard.tsx` to primary interface for Identity, Access Control, Asset Passports, and Audit Logs | M4 | ORIGINAL_REQUEST §R3 |
| 20 | Docker Compose Topology Alignment | Mount `deployments/local.json` and ABIs into `api`, coordinate healthchecks and deterministic startup sequencing | M5 | ORIGINAL_REQUEST §Criteria |
| 21 | Full Stack Boot & Health Verification | Verify `docker compose up --build` boots all services without errors and passes readiness checks | M5 | ORIGINAL_REQUEST §Criteria |
| 22 | Ponytail Metrics Verification | Verify line count reduction (>70%), lower deployment gas, and smaller dependency manifests | M5 | ORIGINAL_REQUEST §Ponytail |
| 23 | E2E Requirement-Driven Test Suite | Opaque-box automated test suite (Tiers 1-4) testing all user journeys and edge cases | E2E Track | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Bloat Deletion & Repo Sanitization | Delete `block/`, `client/`, `archive/`, `SIH...zip`, dead scripts, merge markers, dead frontend JS/3D splines | none | DONE |
| M2 | Smart Contracts Hardening & Gas Optimization | Consolidate `SecureAssetPlatform.sol`, fix SEC-01/02/03, EVM event logging, fix Hardhat tests (100% pass) | M1 | IN_PROGRESS |
| M3 | Production Backend Refactor & Contract Wiring | Fix `auth.py` bug, prune bank/TSP routes, single `requirements.txt`, wire to EVM contract | M1, M2 | PLANNED |
| M4 | Lean Frontend Refactor & Build Stabilization | Prune package.json, fix tsconfig & types, unify UI on `RoleDashboard.tsx`, pass `pnpm run build` | M1, M3 | PLANNED |
| M5 | Full Stack Docker Compose & Final Acceptance | Wire Docker volume mounts, verify `docker compose up --build`, verify Ponytail metrics & E2E pass | M1, M2, M3, M4 | PLANNED |
| E2E | E2E Testing Track | Design comprehensive opaque-box test suite (Tiers 1-4), publish `TEST_READY.md` | none (parallel) | IN_PROGRESS |

## Interface Contracts

### 1. Hardhat Deployment -> Backend API
- **Path**: `deployments/local.json`
- **Schema**:
  ```json
  {
    "chainId": 31337,
    "contracts": {
      "SecureAssetPlatform": {
        "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "abi": [...]
      }
    },
    "deployedAt": "2026-09-06T..."
  }
  ```

### 2. Backend API -> Frontend Console
- **Base URL**: `/api`
- **Authentication**: Bearer JWT in `Authorization` header
- **Endpoints**:
  - `POST /api/auth/nonce?wallet_address=0x...` -> `{ nonce: string, message: string }`
  - `POST /api/auth/login` (`{ wallet_address: string, signature: string }`) -> `{ token: string, role: string, wallet_address: string }`
  - `GET /api/auth/me` -> `{ wallet_address: string, role: string, is_active: boolean, did: string }`
  - `POST /api/identity/register` (`{ did: string, pii_data: string, wallet_address: string }`) -> `{ tx_hash: string, status: string }`
  - `GET /api/identity/status/{wallet}` -> `{ wallet: string, status: string, did: string }`
  - `GET /api/assets/{wallet}` -> `[{ token_id: number, asset_id: string, metadata_hash: string, owner_wallet: string, status: string }]`
  - `POST /api/assets/mint` (`{ asset_id: string, metadata_hash: string, owner_wallet: string }`) -> `{ token_id: number, tx_hash: string }`
  - `POST /api/rbac/request-access` (`{ asset_id: string, action: string }`) -> `{ granted: boolean, reason: string }`
  - `POST /api/rbac/grant-consent` (`{ requester_wallet: string, asset_id: string, access_level: string, duration_seconds: number }`) -> `{ success: boolean, consent_id: string }`
  - `POST /api/rbac/revoke-consent/{id}` -> `{ success: boolean }`
  - `GET /api/rbac/consents/{wallet}` -> `[{ id: string, requester: string, asset_id: string, access_level: string, active: boolean }]`
  - `GET /api/audit/logs` -> `[{ id: string, timestamp: string, actor: string, action: string, details: string }]`
  - `GET /healthz` -> `{ status: "ok" }`
  - `GET /readyz` -> `{ status: "ready", chain_connected: true }`

## Code Layout
```
c:\Users\speed\Documents\antigravity\gallant-pythagoras\
├── docker-compose.yml           # Streamlined Docker Compose stack (hardhat, deploy, api, web)
├── Dockerfile.api               # Lightweight Python 3.12-slim container for FastAPI
├── Dockerfile.web               # Multi-stage container: Node 22 build -> Nginx Alpine
├── contracts/                   # Smart contracts directory
│   ├── SecureAssetPlatform.sol  # Single canonical contract (Identity, RBAC, Asset Passports)
│   ├── test/                    # Hardhat TypeScript test suite
│   │   └── SecureAssetPlatform.test.ts
│   └── scripts/                 # Deployment scripts
│       └── deploy.ts            # Deploys contract and outputs deployments/local.json
├── services/
│   └── api/                     # Production FastAPI backend
│       ├── asgi.py              # ASGI entrypoint
│       ├── app.py               # Application factory
│       ├── config.py            # Environment configuration
│       ├── auth.py              # EIP-191 signature & role dependencies
│       ├── chain.py             # EVM JSON-RPC client
│       ├── db.py                # Lightweight SQLite persistence for audit/nonce cache
│       ├── routes/              # Subsystem routers
│       │   ├── auth_routes.py
│       │   ├── identity_routes.py
│       │   ├── asset_routes.py
│       │   ├── rbac_routes.py
│       │   └── audit_routes.py
│       └── requirements.txt     # Minimal requirements (6 direct packages)
├── apps/
│   └── web/                     # Minimal React 19 + Vite frontend
│       ├── package.json         # Lean dependency list (no Three.js, no bloat)
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── pages/
│           │   └── RoleDashboard.tsx # Unified enterprise console
│           └── lib/
│               ├── api-client.ts
│               └── Web3Context.tsx
└── tests/                       # E2E Test Suite (Tiers 1-4)
```
