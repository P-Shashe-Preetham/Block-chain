"""
Tier 1: Feature Coverage Tests (>=5 tests per feature, total >=30 tests).
Opaque-box verification against PROJECT.md § Interface Contracts:
- W3C DID Identity Registration & Verification
- EIP-191 Auth Challenge Nonce & Login
- ERC-721 Digital Asset Passports
- Granular Consent & RBAC Access Control
- Immutable Audit Trail & Incident Logs
- System Health & Readiness Endpoints
"""

import time
import pytest
import httpx
from tests.e2e.conftest import create_wallet, sign_eip191, login_wallet


# ==============================================================================
# Feature 1: W3C DID Identity Registration & Verification
# ==============================================================================

def test_t1_01_identity_register_success(client: httpx.Client):
    """Verify registration of a new W3C DID identity returns 200 and sets status to PENDING."""
    wallet, _ = create_wallet()
    payload = {
        "did": f"did:bel:enterprise:{wallet.lower()}",
        "pii_data": "Legal Entity Name: Bharat Electronics Ltd",
        "wallet_address": wallet
    }
    resp = client.post("/api/identity/register", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    record = data.get("data", {})
    assert record.get("wallet_address") == wallet
    assert record.get("status") == "PENDING"
    assert "did" in record


def test_t1_02_identity_verify_success(client: httpx.Client):
    """Verify that an admin/evaluator can verify an existing identity to ACTIVE status."""
    wallet, _ = create_wallet()
    reg_payload = {
        "did": f"did:bel:supplier:{wallet.lower()}",
        "pii_data": "Certified Defense Supplier",
        "wallet_address": wallet
    }
    client.post("/api/identity/register", json=reg_payload)

    verify_payload = {"wallet_address": wallet}
    resp = client.post("/api/identity/verify", json=verify_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    assert "ACTIVE" in data.get("message", "")


def test_t1_03_identity_status_registered_pending(client: httpx.Client):
    """Verify querying status of a newly registered identity indicates registered=True and PENDING."""
    wallet, _ = create_wallet()
    did = f"did:bel:device:{wallet.lower()}"
    client.post("/api/identity/register", json={"did": did, "pii_data": "Drone Unit 101", "wallet_address": wallet})

    resp = client.get(f"/api/identity/status/{wallet}")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("registered") is True
    assert data.get("status") == "PENDING"
    assert data.get("did") == did


def test_t1_04_identity_status_verified_active(client: httpx.Client):
    """Verify querying status after verification reflects status=ACTIVE."""
    wallet, _ = create_wallet()
    did = f"did:bel:node:{wallet.lower()}"
    client.post("/api/identity/register", json={"did": did, "pii_data": "Gateway Node", "wallet_address": wallet})
    client.post("/api/identity/verify", json={"wallet_address": wallet})

    resp = client.get(f"/api/identity/status/{wallet}")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("registered") is True
    assert data.get("status") == "ACTIVE"


def test_t1_05_identity_status_unregistered_wallet(client: httpx.Client):
    """Verify querying an unregistered wallet cleanly returns registered=False and status=NONE."""
    wallet, _ = create_wallet()
    resp = client.get(f"/api/identity/status/{wallet}")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("registered") is False
    assert data.get("status") == "NONE"


# ==============================================================================
# Feature 2: EIP-191 Challenge Nonce & Login (Auth)
# ==============================================================================

def test_t1_06_auth_nonce_generation_format(client: httpx.Client):
    """Verify that requesting a nonce returns a 32-byte hex nonce and properly structured challenge message."""
    wallet, _ = create_wallet()
    resp = client.get(f"/api/auth/nonce?wallet_address={wallet}")
    assert resp.status_code == 200
    data = resp.json()
    assert "nonce" in data
    assert len(data["nonce"]) == 64  # 32 bytes hex = 64 characters
    assert "message" in data
    assert wallet in data["message"]
    assert data["nonce"] in data["message"]


def test_t1_07_auth_login_eip191_valid_signature(client: httpx.Client):
    """Verify that submitting a valid EIP-191 signature over the nonce challenge succeeds and returns JWT."""
    wallet, pkey = create_wallet()
    auth_session = login_wallet(client, wallet, pkey)
    assert "token" in auth_session
    assert len(auth_session["token"].split(".")) == 3  # Valid JWT format header.payload.signature
    assert auth_session["address"].lower() == wallet.lower()


def test_t1_08_auth_me_authenticated_user(client: httpx.Client):
    """Verify /api/auth/me returns wallet identity and assigned role for valid bearer token."""
    wallet, pkey = create_wallet()
    auth_session = login_wallet(client, wallet, pkey)

    resp = client.get("/api/auth/me", headers=auth_session["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("wallet_address").lower() == wallet.lower()
    assert "role" in data


def test_t1_09_auth_hash_metadata_keccak256(client: httpx.Client):
    """Verify /api/auth/hash-metadata generates deterministic cryptographic hash of asset metadata."""
    payload = {
        "fileContent": "Hardware-Spec-v2.0-BEL-Secure-Chip",
        "serialUUID": "uuid-9876-5432-1098-7654",
        "timestamp": "2026-09-06T00:00:00Z"
    }
    resp = client.post("/api/auth/hash-metadata", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "metadataHash" in data
    # Hash must be 32 bytes (64 hex chars or 66 with 0x prefix)
    cleaned_hash = data["metadataHash"].replace("0x", "")
    assert len(cleaned_hash) == 64


def test_t1_10_auth_logout_endpoint(client: httpx.Client):
    """Verify /api/auth/logout endpoint confirms session invalidation."""
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert "Logged out" in data.get("message", "")


# ==============================================================================
# Feature 3: ERC-721 Digital Asset Passports
# ==============================================================================

def test_t1_11_asset_mint_success(client: httpx.Client, manager_session: dict):
    """Verify MANAGER can mint a digital asset passport with metadata hash and owner assignment."""
    owner_wallet, _ = create_wallet()
    mint_payload = {
        "owner_wallet": owner_wallet,
        "name": "Radar Signal Processor Unit",
        "description": "Critical avionics radar subsystem",
        "asset_type": "AVIONICS",
        "ipfs_cid": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    resp = client.post("/api/assets/mint", json=mint_payload, headers=manager_session["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    assert "asset" in data
    asset = data["asset"]
    assert asset.get("owner_wallet").lower() == owner_wallet.lower()
    assert asset.get("status") == "ACTIVE"
    assert "token_id" in asset


def test_t1_12_asset_get_by_owner(client: httpx.Client, manager_session: dict):
    """Verify querying /api/assets/{wallet} retrieves all assets owned by the specified wallet."""
    owner_wallet, _ = create_wallet()
    mint_payload = {
        "owner_wallet": owner_wallet,
        "name": "Secure Crypto Module",
        "description": "Tamper-proof HSM module",
        "asset_type": "HARDWARE_HSM",
        "ipfs_cid": "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"
    }
    client.post("/api/assets/mint", json=mint_payload, headers=manager_session["headers"])

    resp = client.get(f"/api/assets/{owner_wallet}", headers=manager_session["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assets = data.get("assets", [])
    assert len(assets) >= 1
    assert any(a.get("owner_wallet").lower() == owner_wallet.lower() for a in assets)


def test_t1_13_asset_mint_multiple_unique_tokens(client: httpx.Client, manager_session: dict):
    """Verify minting multiple assets results in distinct token IDs and unique asset IDs."""
    owner_wallet, _ = create_wallet()
    token_ids = set()
    for i in range(2):
        mint_payload = {
            "owner_wallet": owner_wallet,
            "name": f"Secure Transceiver Pack {i}",
            "description": f"Batch unit {i}",
            "asset_type": "COMMUNICATION",
            "ipfs_cid": f"0x{i:064x}"
        }
        resp = client.post("/api/assets/mint", json=mint_payload, headers=manager_session["headers"])
        assert resp.status_code == 200
        token_ids.add(resp.json()["asset"]["token_id"])

    assert len(token_ids) == 2


def test_t1_14_asset_metadata_hash_persistence(client: httpx.Client, manager_session: dict):
    """Verify metadata hash passed during minting is persistently stored on the asset."""
    owner_wallet, _ = create_wallet()
    test_hash = "0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff"
    mint_payload = {
        "owner_wallet": owner_wallet,
        "name": "Encrypted Telemetry Sensor",
        "description": "Sensors array",
        "asset_type": "SENSOR",
        "ipfs_cid": test_hash
    }
    client.post("/api/assets/mint", json=mint_payload, headers=manager_session["headers"])

    resp = client.get(f"/api/assets/{owner_wallet}", headers=manager_session["headers"])
    assets = resp.json().get("assets", [])
    matching = [a for a in assets if a.get("metadata_hash") == test_hash]
    assert len(matching) == 1


def test_t1_15_asset_initial_active_status(client: httpx.Client, manager_session: dict):
    """Verify that digital assets are minted directly into the ACTIVE status."""
    owner_wallet, _ = create_wallet()
    mint_payload = {
        "owner_wallet": owner_wallet,
        "name": "Optical Targeting Assembly",
        "description": "High precision optics",
        "asset_type": "OPTICS",
        "ipfs_cid": "0xcafe1234cafe1234cafe1234cafe1234cafe1234cafe1234cafe1234cafe1234"
    }
    resp = client.post("/api/assets/mint", json=mint_payload, headers=manager_session["headers"])
    asset = resp.json().get("asset", {})
    assert asset.get("status") == "ACTIVE"


# ==============================================================================
# Feature 4: Granular Consent & Access Control (RBAC)
# ==============================================================================

def test_t1_16_rbac_grant_consent_success(client: httpx.Client, user_session: dict):
    """Verify owner can grant granular time-bounded consent to a requester wallet."""
    requester_wallet, _ = create_wallet()
    payload = {
        "requester_wallet": requester_wallet,
        "asset_id": "BEL-ASSET-RADAR-01",
        "access_level": "READ_TELEMETRY",
        "duration_seconds": 7200
    }
    resp = client.post("/api/rbac/grant-consent", json=payload, headers=user_session["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    consent = data.get("consent", {})
    assert consent.get("active") is True
    assert consent.get("tsp_wallet").lower() == requester_wallet.lower()
    assert consent.get("data_type") == "READ_TELEMETRY"


def test_t1_17_rbac_list_consents_active(client: httpx.Client, user_session: dict):
    """Verify owner can list active consents granted from their wallet."""
    requester_wallet, _ = create_wallet()
    grant_payload = {
        "requester_wallet": requester_wallet,
        "asset_id": "BEL-ASSET-AVIONICS-01",
        "access_level": "READ_SPECS",
        "duration_seconds": 3600
    }
    client.post("/api/rbac/grant-consent", json=grant_payload, headers=user_session["headers"])

    resp = client.get(f"/api/rbac/consents/{user_session['address']}", headers=user_session["headers"])
    assert resp.status_code == 200
    consents = resp.json().get("consents", [])
    assert len(consents) >= 1
    assert any(c.get("data_type") == "READ_SPECS" for c in consents)


def test_t1_18_rbac_revoke_consent_success(client: httpx.Client, user_session: dict):
    """Verify owner can revoke a previously granted consent by consent_id."""
    requester_wallet, _ = create_wallet()
    grant_payload = {
        "requester_wallet": requester_wallet,
        "asset_id": "BEL-ASSET-BATTERY-01",
        "access_level": "READ_HEALTH",
        "duration_seconds": 3600
    }
    grant_resp = client.post("/api/rbac/grant-consent", json=grant_payload, headers=user_session["headers"])
    consent_id = grant_resp.json()["consent"]["consent_id"]

    resp = client.post(f"/api/rbac/revoke-consent/{consent_id}", headers=user_session["headers"])
    assert resp.status_code == 200
    assert resp.json().get("success") is True


def test_t1_19_rbac_request_access_granted_with_consent(client: httpx.Client):
    """Verify an auditor/manager requester is granted access when active consent matches."""
    from tests.e2e.conftest import create_role_session
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    asset_id = "BEL-ASSET-CRYPT-99"
    access_level = "AUDIT_VERIFY"

    # Owner grants consent
    client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": access_level,
            "duration_seconds": 3600
        },
        headers=owner["headers"]
    )

    # Auditor requests access
    req_payload = {
        "owner_wallet": owner["address"],
        "asset_id": asset_id,
        "access_level": access_level
    }
    resp = client.post("/api/rbac/request-access", json=req_payload, headers=auditor["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    assert "granted" in data.get("message", "").lower()


def test_t1_20_rbac_access_logs_recorded(client: httpx.Client):
    """Verify access requests generate audit access log entries."""
    from tests.e2e.conftest import create_role_session
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    client.post(
        "/api/rbac/request-access",
        json={"owner_wallet": owner["address"], "asset_id": "BEL-ASSET-01", "access_level": "PROBE"},
        headers=auditor["headers"]
    )

    resp = client.get(f"/api/rbac/access-logs/{auditor['address']}", headers=auditor["headers"])
    assert resp.status_code == 200
    logs = resp.json().get("logs", [])
    assert len(logs) >= 1
    assert any(log.get("requester_wallet") == auditor["address"].lower() for log in logs)


# ==============================================================================
# Feature 5: Immutable Audit Trail & Incident Logs
# ==============================================================================

def test_t1_21_audit_logs_endpoint_returns_200(client: httpx.Client):
    """Verify /api/audit/logs endpoint responds with HTTP 200 and list structure."""
    resp = client.get("/api/audit/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert "audit_logs" in data
    assert isinstance(data["audit_logs"], list)


def test_t1_22_audit_logs_record_schema(client: httpx.Client):
    """Verify schema properties of audit log entries."""
    from services.api.database.connection import db
    from services.api.database.models import AuditLogRecord
    # Ensure at least one test record is present
    test_rec = AuditLogRecord(
        log_id="aud_test_schema",
        user_wallet="0x1111111111111111111111111111111111111111",
        bank_wallet="0x2222222222222222222222222222222222222222",
        tsp_wallet="0x3333333333333333333333333333333333333333",
        data_type="FINANCIAL_DATA",
        granted=True,
        reason="Test Authorization",
        timestamp=str(int(time.time()))
    )
    db.audit_logs.insert(0, test_rec)

    resp = client.get("/api/audit/logs")
    logs = resp.json().get("audit_logs", [])
    assert len(logs) >= 1
    record = logs[0]
    assert "log_id" in record
    assert "granted" in record
    assert "timestamp" in record


def test_t1_23_audit_incidents_endpoint_returns_200(client: httpx.Client):
    """Verify /api/audit/incidents endpoint responds with HTTP 200 and list structure."""
    resp = client.get("/api/audit/incidents")
    assert resp.status_code == 200
    data = resp.json()
    assert "incidents" in data
    assert isinstance(data["incidents"], list)


def test_t1_24_audit_incidents_record_schema(client: httpx.Client):
    """Verify schema properties of security incident log entries."""
    from services.api.database.connection import db
    from services.api.database.models import IncidentLog
    test_incident = IncidentLog(
        log_id="inc_test_001",
        requester="0x9999999999999999999999999999999999999999",
        token_id=42,
        asset_id="BEL-ASSET-TOPSECRET",
        reason="Unauthorized access attempt",
        timestamp="2026-09-06T00:00:00Z"
    )
    db.incident_logs.insert(0, test_incident)

    resp = client.get("/api/audit/incidents")
    incidents = resp.json().get("incidents", [])
    assert len(incidents) >= 1
    inc = incidents[0]
    assert "log_id" in inc
    assert "reason" in inc
    assert "timestamp" in inc


def test_t1_25_audit_logs_chronological_sequence(client: httpx.Client):
    """Verify successive audit queries return consistent, accessible trail records."""
    r1 = client.get("/api/audit/logs")
    r2 = client.get("/api/audit/logs")
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert len(r1.json()["audit_logs"]) <= len(r2.json()["audit_logs"])


# ==============================================================================
# Feature 6: System Health & Readiness Endpoints
# ==============================================================================

def test_t1_26_healthz_status_ok(client: httpx.Client):
    """Verify /healthz returns status: ok."""
    resp = client.get("/healthz")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"


def test_t1_27_readyz_status_ready(client: httpx.Client):
    """Verify /readyz returns status: ready."""
    resp = client.get("/readyz")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ready"


def test_t1_28_healthz_content_type_json(client: httpx.Client):
    """Verify /healthz sets standard application/json content type."""
    resp = client.get("/healthz")
    assert "application/json" in resp.headers.get("content-type", "")


def test_t1_29_readyz_content_type_json(client: httpx.Client):
    """Verify /readyz sets standard application/json content type."""
    resp = client.get("/readyz")
    assert "application/json" in resp.headers.get("content-type", "")


def test_t1_30_healthz_unauthenticated_public_access(client: httpx.Client):
    """Verify health probes succeed without requiring authentication headers (fail-open for probes)."""
    resp = client.get("/healthz", headers={})
    assert resp.status_code == 200
    assert resp.json().get("status") == "ok"
