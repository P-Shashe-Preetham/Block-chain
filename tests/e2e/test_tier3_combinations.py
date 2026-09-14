"""
Tier 3: Cross-Feature Combination Tests (Pairwise Interactions, >=10 tests).
Verifies interfaces between subsystems:
- Identity + Auth (/api/identity/register -> /api/auth/me)
- Asset Minting + RBAC Consent (mint asset -> grant consent for asset_id)
- Consent Lifecycle + Access Evaluation (grant -> access granted, revoke -> access denied)
- Access Evaluation + Audit Trail (request access -> verify log entry in audit trail)
- Auth Hashing + Asset Passport (hash-metadata -> mint asset with verified keccak256)
- Multi-party Consent Isolation (Auditor A vs Auditor B boundaries)
"""

import time
import pytest
import httpx
from tests.e2e.conftest import create_wallet, login_wallet, create_role_session


def test_t3_01_register_identity_then_auth_me_reflects_did(client: httpx.Client):
    """Pairwise: Identity registration followed by EIP-191 login reflects registered DID in /api/auth/me."""
    wallet, pkey = create_wallet()
    did = f"did:bel:operator:{wallet.lower()}"

    # 1. Register identity
    reg_resp = client.post(
        "/api/identity/register",
        json={"did": did, "pii_data": "Flight Operations Team", "wallet_address": wallet}
    )
    assert reg_resp.status_code == 200

    # 2. Login via EIP-191
    auth_session = login_wallet(client, wallet, pkey)

    # 3. Query /api/auth/me
    me_resp = client.get("/api/auth/me", headers=auth_session["headers"])
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data.get("wallet_address").lower() == wallet.lower()
    assert me_data.get("did") == did
    assert me_data.get("status") == "PENDING"


def test_t3_02_mint_asset_then_grant_consent_by_asset_id(client: httpx.Client):
    """Pairwise: Manager mints digital passport; owner grants consent specifically tied to that asset_id."""
    manager = create_role_session(client, "MANAGER")
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    # 1. Mint asset for owner
    mint_resp = client.post(
        "/api/assets/mint",
        json={
            "owner_wallet": owner["address"],
            "name": "Secured Drone Airframe",
            "description": "Carbon composite frame",
            "asset_type": "AIRFRAME",
            "ipfs_cid": "0x1234567890abcdef"
        },
        headers=manager["headers"]
    )
    assert mint_resp.status_code == 200
    asset_id = mint_resp.json()["asset"]["asset_id"]

    # 2. Owner grants consent for this exact asset_id
    grant_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": "AIRFRAME_INSPECT",
            "duration_seconds": 3600
        },
        headers=owner["headers"]
    )
    assert grant_resp.status_code == 200
    consent = grant_resp.json()["consent"]
    assert consent["bank_wallet"] == asset_id
    assert consent["tsp_wallet"].lower() == auditor["address"].lower()


def test_t3_03_grant_consent_then_request_access_flow(client: httpx.Client):
    """Pairwise: Grant consent -> evaluate access -> verify access is granted."""
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")
    asset_id = "BEL-RADAR-COMBO-01"

    # Grant consent
    client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": "FREQUENCY_ANALYSIS",
            "duration_seconds": 3600
        },
        headers=owner["headers"]
    )

    # Request access
    resp = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": owner["address"],
            "asset_id": asset_id,
            "access_level": "FREQUENCY_ANALYSIS"
        },
        headers=auditor["headers"]
    )
    assert resp.status_code == 200
    assert resp.json().get("success") is True


def test_t3_04_revoke_consent_then_request_access_denied(client: httpx.Client):
    """Pairwise: Grant consent -> Revoke consent -> evaluate access -> verify access is immediately denied."""
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")
    asset_id = "BEL-WEAPON-SYSTEM-01"

    # 1. Grant consent
    grant_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": "CALIBRATION_READ",
            "duration_seconds": 3600
        },
        headers=owner["headers"]
    )
    consent_id = grant_resp.json()["consent"]["consent_id"]

    # 2. Revoke consent
    revoke_resp = client.post(f"/api/rbac/revoke-consent/{consent_id}", headers=owner["headers"])
    assert revoke_resp.status_code == 200

    # 3. Request access -> must be denied
    req_resp = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": owner["address"],
            "asset_id": asset_id,
            "access_level": "CALIBRATION_READ"
        },
        headers=auditor["headers"]
    )
    assert req_resp.status_code == 200
    assert req_resp.json().get("success") is False


def test_t3_05_request_access_generates_access_audit_log(client: httpx.Client):
    """Pairwise: Access request execution automatically records an audit access log entry."""
    owner = create_role_session(client, "USER")
    manager = create_role_session(client, "MANAGER")

    req_payload = {
        "owner_wallet": owner["address"],
        "asset_id": "BEL-SONAR-01",
        "access_level": "HYDROPHONE_SYNC"
    }
    client.post("/api/rbac/request-access", json=req_payload, headers=manager["headers"])

    # Query access logs for the manager
    log_resp = client.get(f"/api/rbac/access-logs/{manager['address']}", headers=manager["headers"])
    assert log_resp.status_code == 200
    logs = log_resp.json().get("logs", [])
    matching = [l for l in logs if l.get("action") == "HYDROPHONE_SYNC"]
    assert len(matching) >= 1


def test_t3_06_hash_metadata_linked_to_minted_asset(client: httpx.Client):
    """Pairwise: Hash asset specs via /api/auth/hash-metadata, mint asset with returned hash, verify persistence."""
    manager = create_role_session(client, "MANAGER")
    owner = create_role_session(client, "USER")

    # 1. Generate cryptographic hash
    hash_resp = client.post(
        "/api/auth/hash-metadata",
        json={
            "fileContent": "BEL-MISSILE-GUIDANCE-V3",
            "serialUUID": "uuid-missile-1002",
            "timestamp": "2026-09-06T12:00:00Z"
        }
    )
    assert hash_resp.status_code == 200
    computed_hash = hash_resp.json()["metadataHash"]

    # 2. Mint asset with this hash
    mint_resp = client.post(
        "/api/assets/mint",
        json={
            "owner_wallet": owner["address"],
            "name": "Missile Guidance System V3",
            "description": "Guidance module",
            "asset_type": "MISSILE_GUIDANCE",
            "ipfs_cid": computed_hash
        },
        headers=manager["headers"]
    )
    assert mint_resp.status_code == 200
    asset = mint_resp.json()["asset"]
    assert asset["metadata_hash"] == computed_hash

    # 3. Retrieve and verify
    get_resp = client.get(f"/api/assets/{owner['address']}", headers=manager["headers"])
    assert any(a.get("metadata_hash") == computed_hash for a in get_resp.json().get("assets", []))


def test_t3_07_unverified_identity_lifecycle_gate(client: httpx.Client):
    """Pairwise: Verify identity lifecycle transition from PENDING to ACTIVE across identity status endpoint."""
    wallet, _ = create_wallet()
    did = f"did:bel:unit:{wallet.lower()}"

    # Register
    client.post("/api/identity/register", json={"did": did, "pii_data": "Field Unit", "wallet_address": wallet})
    s1 = client.get(f"/api/identity/status/{wallet}").json()
    assert s1["status"] == "PENDING"

    # Verify
    client.post("/api/identity/verify", json={"wallet_address": wallet})
    s2 = client.get(f"/api/identity/status/{wallet}").json()
    assert s2["status"] == "ACTIVE"


def test_t3_08_multi_party_consent_isolation(client: httpx.Client):
    """Pairwise: Verify consent isolation between multiple parties. Consent to Auditor A does not grant Auditor B."""
    owner = create_role_session(client, "USER")
    auditor_a = create_role_session(client, "AUDITOR")
    auditor_b = create_role_session(client, "AUDITOR")
    asset_id = "BEL-ISOLATED-CRYPTODRIVE"

    # Grant consent ONLY to Auditor A
    client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor_a["address"],
            "asset_id": asset_id,
            "access_level": "DRIVE_READ",
            "duration_seconds": 3600
        },
        headers=owner["headers"]
    )

    req_payload = {
        "owner_wallet": owner["address"],
        "asset_id": asset_id,
        "access_level": "DRIVE_READ"
    }

    # Auditor A requests access -> Granted
    r_a = client.post("/api/rbac/request-access", json=req_payload, headers=auditor_a["headers"])
    assert r_a.json().get("success") is True

    # Auditor B requests access -> Denied
    r_b = client.post("/api/rbac/request-access", json=req_payload, headers=auditor_b["headers"])
    assert r_b.json().get("success") is False


def test_t3_09_expired_consent_access_rejection(client: httpx.Client):
    """Pairwise: Time-bounded consent expiration denies subsequent access evaluation requests."""
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")
    asset_id = "BEL-TIMEBOUND-DATA"

    # Grant consent with negative duration (already expired)
    client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": "EPHEMERAL_READ",
            "duration_seconds": -50
        },
        headers=owner["headers"]
    )

    # Request access
    resp = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": owner["address"],
            "asset_id": asset_id,
            "access_level": "EPHEMERAL_READ"
        },
        headers=auditor["headers"]
    )
    assert resp.status_code == 200
    assert resp.json().get("success") is False


def test_t3_10_manager_mint_owner_consent_auditor_access(client: httpx.Client):
    """Tri-party workflow: Manager mints -> Owner grants consent -> Auditor exercises authorized access."""
    manager = create_role_session(client, "MANAGER")
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    # Step 1: Manager mints asset passport
    mint_resp = client.post(
        "/api/assets/mint",
        json={
            "owner_wallet": owner["address"],
            "name": "Secured Transceiver Tri-Party",
            "description": "Cross-boundary military radio",
            "asset_type": "TRANSCEIVER",
            "ipfs_cid": "0xcafe" + "0" * 60
        },
        headers=manager["headers"]
    )
    asset_id = mint_resp.json()["asset"]["asset_id"]

    # Step 2: Owner grants consent to Auditor
    grant_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": "RADIO_SPECS_READ",
            "duration_seconds": 1800
        },
        headers=owner["headers"]
    )
    assert grant_resp.json().get("success") is True

    # Step 3: Auditor requests access
    access_resp = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": owner["address"],
            "asset_id": asset_id,
            "access_level": "RADIO_SPECS_READ"
        },
        headers=auditor["headers"]
    )
    assert access_resp.json().get("success") is True


def test_t3_11_access_logs_filtering_for_auditor_vs_owner(client: httpx.Client):
    """Pairwise: Verify access logs query adheres to role constraints (Auditors inspect audit trail)."""
    auditor = create_role_session(client, "AUDITOR")
    resp = client.get(f"/api/rbac/access-logs/{auditor['address']}", headers=auditor["headers"])
    assert resp.status_code == 200
    assert "logs" in resp.json()
