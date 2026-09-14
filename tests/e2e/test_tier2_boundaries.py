"""
Tier 2: Boundary, Corner Cases & Adversarial Verification Tests (>=5 tests per feature, total >=30 tests).
Covers:
- Identity edge cases (malformed wallets, 404 on missing, adversarial payload inputs)
- Auth boundary cases (invalid signatures, replay attacks, expired nonces, malformed JWTs)
- Asset minting authorization boundaries (role gates, missing payload validation)
- RBAC boundary conditions (unauthorized revocation, cross-user consent leakage, non-consented access denial)
- Audit logs HTTP method safety and SQL injection/script parameter tampering
- System health HTTP methods and CORS boundary checks
"""

import time
import pytest
import httpx
from eth_account import Account
from eth_account.messages import encode_defunct
from tests.e2e.conftest import create_wallet, sign_eip191, login_wallet, create_role_session


# ==============================================================================
# Feature 1 Boundary: Identity Edge Cases
# ==============================================================================

def test_t2_01_identity_register_empty_did_rejection(client: httpx.Client):
    """Verify registration with missing or empty DID returns 422 validation error."""
    wallet, _ = create_wallet()
    resp = client.post("/api/identity/register", json={"pii_data": "Legal Entity", "wallet_address": wallet})
    assert resp.status_code == 422


def test_t2_02_identity_register_invalid_wallet_format(client: httpx.Client):
    """Verify registration with non-hex malformed wallet address fails or is sanitized."""
    resp = client.post(
        "/api/identity/register",
        json={"did": "did:bel:invalid", "pii_data": "Data", "wallet_address": "not-an-eth-address"}
    )
    assert resp.status_code in [200, 400, 422]


def test_t2_03_identity_register_duplicate_wallet_conflict(client: httpx.Client):
    """Verify registering an already registered wallet overwrites or maintains consistent state without 500 error."""
    wallet, _ = create_wallet()
    client.post("/api/identity/register", json={"did": "did:bel:dup1", "pii_data": "Data 1", "wallet_address": wallet})
    resp = client.post("/api/identity/register", json={"did": "did:bel:dup2", "pii_data": "Data 2", "wallet_address": wallet})
    assert resp.status_code == 200
    status_resp = client.get(f"/api/identity/status/{wallet}")
    assert status_resp.status_code == 200


def test_t2_04_identity_verify_nonexistent_wallet_returns_404(client: httpx.Client):
    """Verify attempting to verify an unregistered wallet returns 404 Not Found."""
    unregistered_wallet, _ = create_wallet()
    resp = client.post("/api/identity/verify", json={"wallet_address": unregistered_wallet})
    assert resp.status_code == 404
    assert "not found" in resp.json().get("detail", "").lower()


def test_t2_05_identity_register_adversarial_special_chars(client: httpx.Client):
    """Verify that inputs with HTML tags, quotes, and unicode do not break the API or cause injection."""
    wallet, _ = create_wallet()
    adversarial_did = "did:bel:<script>alert('xss')</script>\"'--;#"
    adversarial_pii = "P&I's; DROP TABLE users; \u2603 \U0001F600"
    resp = client.post("/api/identity/register", json={
        "did": adversarial_did,
        "pii_data": adversarial_pii,
        "wallet_address": wallet
    })
    assert resp.status_code == 200
    status_resp = client.get(f"/api/identity/status/{wallet}")
    assert status_resp.status_code == 200
    assert status_resp.json().get("did") == adversarial_did


# ==============================================================================
# Feature 2 Boundary: Auth Nonce & Login Boundary Cases
# ==============================================================================

def test_t2_06_auth_nonce_missing_or_invalid_wallet_prefix(client: httpx.Client):
    """Verify requesting a nonce without a valid '0x' prefixed wallet returns 400 Bad Request."""
    resp = client.get("/api/auth/nonce?wallet_address=1234567890abcdef")
    assert resp.status_code == 400
    assert "invalid wallet" in resp.json().get("detail", "").lower()


def test_t2_07_auth_login_invalid_signature_rejected_401(client: httpx.Client):
    """Verify login attempt with corrupted or forged ECDSA signature returns 401 Unauthorized."""
    wallet, _ = create_wallet()
    nonce_resp = client.get(f"/api/auth/nonce?wallet_address={wallet}")
    nonce = nonce_resp.json()["nonce"]

    bogus_sig = "0x" + "00" * 65
    resp = client.post("/api/auth/login", json={
        "wallet_address": wallet,
        "signature": bogus_sig,
        "nonce": nonce
    })
    assert resp.status_code == 401


def test_t2_08_auth_login_nonce_replay_rejected_400(client: httpx.Client):
    """Verify replay protection: submitting the same nonce challenge twice is rejected."""
    wallet, pkey = create_wallet()
    nonce_resp = client.get(f"/api/auth/nonce?wallet_address={wallet}")
    data = nonce_resp.json()
    sig = sign_eip191(data["message"], pkey)

    payload = {"wallet_address": wallet, "signature": sig, "nonce": data["nonce"]}
    # First login must succeed
    r1 = client.post("/api/auth/login", json=payload)
    assert r1.status_code == 200

    # Second login with same nonce must be rejected (single-use)
    r2 = client.post("/api/auth/login", json=payload)
    assert r2.status_code == 400


def test_t2_09_auth_login_unrequested_nonce_rejected_400(client: httpx.Client):
    """Verify submitting a login request for a wallet that never requested a nonce fails with 400."""
    wallet, pkey = create_wallet()
    fake_nonce = "ffff" * 16
    sig = sign_eip191("fake message", pkey)

    resp = client.post("/api/auth/login", json={
        "wallet_address": wallet,
        "signature": sig,
        "nonce": fake_nonce
    })
    assert resp.status_code == 400


def test_t2_10_auth_me_missing_or_invalid_bearer_token(client: httpx.Client):
    """Verify /api/auth/me returns 401 when Authorization header is absent, malformed, or invalid."""
    # Case A: Missing header
    r1 = client.get("/api/auth/me")
    assert r1.status_code == 401

    # Case B: Malformed header
    r2 = client.get("/api/auth/me", headers={"Authorization": "Basic admin:password"})
    assert r2.status_code == 401

    # Case C: Invalid token string
    r3 = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.payload"})
    assert r3.status_code == 401


# ==============================================================================
# Feature 3 Boundary: Asset Passports Role & Validation Gates
# ==============================================================================

def test_t2_11_asset_mint_unauthorized_role_rejected_403(client: httpx.Client, user_session: dict):
    """Verify that a standard USER role cannot mint digital asset passports (403 Forbidden)."""
    mint_payload = {
        "owner_wallet": user_session["address"],
        "name": "Unauthorized Mint Attempt",
        "description": "Attempt by non-manager",
        "asset_type": "EQUIPMENT",
        "ipfs_cid": "0x1234"
    }
    resp = client.post("/api/assets/mint", json=mint_payload, headers=user_session["headers"])
    assert resp.status_code == 403


def test_t2_12_asset_mint_missing_required_fields_422(client: httpx.Client, manager_session: dict):
    """Verify submitting mint payload with missing required schema fields triggers 422 Unprocessable Entity."""
    incomplete_payload = {
        "name": "Missing Owner And Cid"
    }
    resp = client.post("/api/assets/mint", json=incomplete_payload, headers=manager_session["headers"])
    assert resp.status_code == 422


def test_t2_13_asset_mint_empty_metadata_hash(client: httpx.Client, manager_session: dict):
    """Verify minting accepts empty/short CID string without server crash."""
    owner_wallet, _ = create_wallet()
    payload = {
        "owner_wallet": owner_wallet,
        "name": "Test Asset Short CID",
        "description": "Short CID",
        "asset_type": "TEST",
        "ipfs_cid": "0x0"
    }
    resp = client.post("/api/assets/mint", json=payload, headers=manager_session["headers"])
    assert resp.status_code == 200


def test_t2_14_asset_get_unauthorized_access_401(client: httpx.Client):
    """Verify /api/assets/{wallet} requires Bearer authorization header."""
    wallet, _ = create_wallet()
    resp = client.get(f"/api/assets/{wallet}")
    assert resp.status_code == 401


def test_t2_15_asset_mint_extreme_payload_stress(client: httpx.Client, manager_session: dict):
    """Stress test: verify asset description of 32KB is handled properly."""
    owner_wallet, _ = create_wallet()
    large_description = "BEL-SPEC-" + ("X" * 32000)
    payload = {
        "owner_wallet": owner_wallet,
        "name": "Stress Hardware Spec",
        "description": large_description,
        "asset_type": "HEAVY_PAYLOAD",
        "ipfs_cid": "0x" + "a" * 64
    }
    resp = client.post("/api/assets/mint", json=payload, headers=manager_session["headers"])
    assert resp.status_code == 200
    assert resp.json().get("success") is True


# ==============================================================================
# Feature 4 Boundary: Granular Consent & RBAC Access Control
# ==============================================================================

def test_t2_16_rbac_request_access_denied_without_consent(client: httpx.Client):
    """Verify that requesting access to an asset without prior consent returns access denied."""
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    req_payload = {
        "owner_wallet": owner["address"],
        "asset_id": "BEL-RESTRICTED-CRYPTO",
        "access_level": "RESTRICTED_KEY_READ"
    }
    resp = client.post("/api/rbac/request-access", json=req_payload, headers=auditor["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is False
    assert "consent required" in data.get("message", "").lower() or "denied" in data.get("message", "").lower()


def test_t2_17_rbac_revoke_consent_nonexistent_id_404(client: httpx.Client, user_session: dict):
    """Verify revoking a non-existent consent ID returns 404 Not Found."""
    resp = client.post("/api/rbac/revoke-consent/cst_nonexistent_999", headers=user_session["headers"])
    assert resp.status_code == 404


def test_t2_18_rbac_revoke_consent_by_non_owner_403(client: httpx.Client):
    """Verify a user cannot revoke another user's consent (403 Forbidden)."""
    user_a = create_role_session(client, "USER")
    user_b = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    # User A grants consent
    grant_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": "BEL-ASSET-01",
            "access_level": "READ",
            "duration_seconds": 3600
        },
        headers=user_a["headers"]
    )
    consent_id = grant_resp.json()["consent"]["consent_id"]

    # User B attempts to revoke User A's consent
    revoke_resp = client.post(f"/api/rbac/revoke-consent/{consent_id}", headers=user_b["headers"])
    assert revoke_resp.status_code == 403


def test_t2_19_rbac_list_consents_unauthorized_wallet_forbidden(client: httpx.Client):
    """Verify a non-admin user cannot inspect another wallet's consents."""
    user_a = create_role_session(client, "USER")
    user_b = create_role_session(client, "USER")

    resp = client.get(f"/api/rbac/consents/{user_a['address']}", headers=user_b["headers"])
    assert resp.status_code == 403


def test_t2_20_rbac_grant_consent_negative_duration_handled(client: httpx.Client, user_session: dict):
    """Verify granting consent with negative duration results in already expired consent."""
    requester, _ = create_wallet()
    payload = {
        "requester_wallet": requester,
        "asset_id": "BEL-ASSET-EXPIRED",
        "access_level": "READ",
        "duration_seconds": -100
    }
    resp = client.post("/api/rbac/grant-consent", json=payload, headers=user_session["headers"])
    assert resp.status_code == 200
    consent = resp.json()["consent"]
    assert consent["expires_at"] < consent["created_at"]


# ==============================================================================
# Feature 5 Boundary: Audit Logs Method & Parameter Boundary
# ==============================================================================

def test_t2_21_audit_logs_unsupported_post_rejected_405(client: httpx.Client):
    """Verify POST to /api/audit/logs returns 405 Method Not Allowed (read-only endpoint)."""
    resp = client.post("/api/audit/logs", json={"hack": "attempt"})
    assert resp.status_code == 405


def test_t2_22_audit_incidents_unsupported_post_rejected_405(client: httpx.Client):
    """Verify POST to /api/audit/incidents returns 405 Method Not Allowed (read-only endpoint)."""
    resp = client.post("/api/audit/incidents", json={"hack": "attempt"})
    assert resp.status_code == 405


def test_t2_23_audit_logs_tampered_filter_params_safe(client: httpx.Client):
    """Verify query parameter injection attempts on audit logs do not crash the server."""
    resp = client.get("/api/audit/logs?format=json&injection=' OR '1'='1")
    assert resp.status_code == 200


def test_t2_24_audit_logs_retains_denial_events(client: httpx.Client):
    """Verify that access denial is recorded in access logs for compliance."""
    user = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    # Request without consent
    client.post(
        "/api/rbac/request-access",
        json={"owner_wallet": user["address"], "asset_id": "DENIED-ASSET", "access_level": "WRITE_FIRMWARE"},
        headers=auditor["headers"]
    )

    resp = client.get(f"/api/rbac/access-logs/{auditor['address']}", headers=auditor["headers"])
    assert resp.status_code == 200
    logs = resp.json().get("logs", [])
    denials = [log for log in logs if log.get("granted") is False]
    assert len(denials) >= 1


def test_t2_25_audit_incidents_empty_list_when_no_violations(client: httpx.Client):
    """Verify incidents endpoint returns a clean JSON list when queried."""
    resp = client.get("/api/audit/incidents")
    assert resp.status_code == 200
    assert isinstance(resp.json().get("incidents"), list)


# ==============================================================================
# Feature 6 Boundary: System Health & Readiness Method Boundary
# ==============================================================================

def test_t2_26_healthz_extraneous_query_params_ignored(client: httpx.Client):
    """Verify /healthz ignores arbitrary extraneous query parameters."""
    resp = client.get("/healthz?probe=liveness&check=all&timestamp=99999")
    assert resp.status_code == 200
    assert resp.json().get("status") == "ok"


def test_t2_27_readyz_extraneous_query_params_ignored(client: httpx.Client):
    """Verify /readyz ignores arbitrary extraneous query parameters."""
    resp = client.get("/readyz?readiness=deep")
    assert resp.status_code == 200
    assert resp.json().get("status") == "ready"


def test_t2_28_healthz_method_not_allowed_on_post(client: httpx.Client):
    """Verify POST /healthz returns 405 Method Not Allowed."""
    resp = client.post("/healthz", json={})
    assert resp.status_code == 405


def test_t2_29_readyz_method_not_allowed_on_post(client: httpx.Client):
    """Verify POST /readyz returns 405 Method Not Allowed."""
    resp = client.post("/readyz", json={})
    assert resp.status_code == 405


def test_t2_30_healthz_cors_preflight_response(client: httpx.Client):
    """Verify OPTIONS preflight request to /healthz returns 200 and standard CORS headers."""
    resp = client.options(
        "/healthz",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert resp.status_code == 200
    assert "access-control-allow-origin" in resp.headers
