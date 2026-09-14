# E2E Test Infra: SIH26125 Blockchain Platform

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | W3C DID Identity Registration & Verification | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 2 | EIP-191 Challenge Nonce & Login | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 3 | ERC-721 Digital Asset Passport Minting | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 4 | Granular Consent & Access Control (RBAC) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | Immutable Audit Trail & Incident Logs | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | System Health & Readiness Endpoints | ORIGINAL_REQUEST §Acceptance | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Python `pytest` / `httpx` (API level) and Hardhat / Playwright
- Target URL: `http://127.0.0.1:8000` (Backend API) and `http://127.0.0.1:3000` (Web Console)
- Directory layout: `tests/e2e/`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Enterprise Equipment Onboarding & Custody Transfer | Identity + Asset Minting + Two-person Approval | High |
| 2 | Auditor Access Delegation & Revocation | Identity + Consent Grant + Access Rule + Audit Trail | High |
| 3 | Unauthorized Access Attempt & Incident Response | Malicious Role Attempt + 403 Forbidden + Incident Log Query | Medium |
| 4 | Expired Consent Rejection | Time-bounded Consent + Expiry + Access Denied | Medium |
| 5 | Identity Key Rotation & Lifecycle Suspension | Admin Key Replacement + Deactivation + Re-registration Prevention | High |

## Coverage Thresholds
- Tier 1: ≥5 per feature (≥30 tests)
- Tier 2: ≥5 per feature (≥30 boundary tests)
- Tier 3: Pairwise coverage of major feature interactions (≥10 tests)
- Tier 4: ≥5 realistic application scenarios
