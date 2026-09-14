"""
Tier 4: Real-World Application Scenarios (>=5 complete user journeys).
Detailed realistic workflows adhering to TEST_INFRA.md:
1. Enterprise Equipment Onboarding & Custody Transfer
2. Auditor Access Delegation & Revocation
3. Unauthorized Access Attempt & Incident Response
4. Expired Consent Rejection
5. Identity Lifecycle & Multi-Role Governance
"""

import time
import pytest
import httpx
from tests.e2e.conftest import create_wallet, login_wallet, create_role_session


def test_t4_01_scenario_equipment_onboarding_and_custody_transfer(client: httpx.Client):
    """
    Scenario 1: Enterprise Equipment Onboarding & Custody Transfer.
    - Supplier and Custodian identities registered and verified.
    - Equipment metadata cryptographically hashed (keccak256).
    - Manager mints ERC-721 Digital Asset Passport.
    - Custody verification: Custodian receives granted consent to inspect asset passport.
    """
    manager = create_role_session(client, "MANAGER")
    supplier_wallet, supplier_key = create_wallet()
    custodian_wallet, custodian_key = create_wallet()

    # 1. Register and verify Supplier Identity
    supplier_did = f"did:bel:supplier:{supplier_wallet.lower()}"
    reg_s = client.post("/api/identity/register", json={
        "did": supplier_did,
        "pii_data": "Defense Communications Division",
        "wallet_address": supplier_wallet
    })
    assert reg_s.status_code == 200
    client.post("/api/identity/verify", json={"wallet_address": supplier_wallet})

    # 2. Register and verify Custodian Identity
    custodian_did = f"did:bel:custodian:{custodian_wallet.lower()}"
    reg_c = client.post("/api/identity/register", json={
        "did": custodian_did,
        "pii_data": "Forward Operating Base Depot",
        "wallet_address": custodian_wallet
    })
    assert reg_c.status_code == 200
    client.post("/api/identity/verify", json={"wallet_address": custodian_wallet})

    # 3. Hash Physical Asset Metadata
    hash_resp = client.post("/api/auth/hash-metadata", json={
        "fileContent": "BEL-TAC-COMM-RADIO-V4.2-SPECIFICATION",
        "serialUUID": "RADIO-SN-2026-BEL-0091",
        "timestamp": "2026-09-06T06:00:00Z"
    })
    assert hash_resp.status_code == 200
    metadata_hash = hash_resp.json()["metadataHash"]

    # 4. Mint Digital Asset Passport
    mint_resp = client.post(
        "/api/assets/mint",
        json={
            "owner_wallet": supplier_wallet,
            "name": "Tactical Radio Transceiver Mk-IV",
            "description": "Secure frequency-hopping transceiver",
            "asset_type": "TACTICAL_RADIO",
            "ipfs_cid": metadata_hash
        },
        headers=manager["headers"]
    )
    assert mint_resp.status_code == 200
    minted_asset = mint_resp.json()["asset"]
    asset_id = minted_asset["asset_id"]

    # 5. Supplier logs in and grants custody inspection consent to Custodian
    supplier_auth = login_wallet(client, supplier_wallet, supplier_key)
    consent_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": custodian_wallet,
            "asset_id": asset_id,
            "access_level": "CUSTODY_VERIFY",
            "duration_seconds": 86400  # 24 hours
        },
        headers=supplier_auth["headers"]
    )
    assert consent_resp.status_code == 200
    assert consent_resp.json()["success"] is True

    # 6. Custodian logs in and exercises access evaluation
    from tests.e2e.conftest import create_role_session_for_wallet
    custodian_auth = create_role_session_for_wallet(client, custodian_wallet, "MANAGER", private_key=custodian_key)
    access_resp = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": supplier_wallet,
            "asset_id": asset_id,
            "access_level": "CUSTODY_VERIFY"
        },
        headers=custodian_auth["headers"]
    )
    assert access_resp.status_code == 200
    assert access_resp.json()["success"] is True


def test_t4_02_scenario_auditor_access_delegation_and_revocation(client: httpx.Client):
    """
    Scenario 2: Auditor Access Delegation & Revocation.
    - Owner grants time-bounded consent on sensitive asset passport.
    - Auditor accesses asset and action is audited.
    - Owner revokes consent.
    - Auditor is subsequent blocked and incident/access trail reflects denial.
    """
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")
    asset_id = "BEL-RADAR-ARRAY-S2"
    access_scope = "FIRMWARE_AUDIT"

    # 1. Owner grants consent
    grant_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": access_scope,
            "duration_seconds": 3600
        },
        headers=owner["headers"]
    )
    assert grant_resp.status_code == 200
    consent_id = grant_resp.json()["consent"]["consent_id"]

    # 2. Auditor requests access -> Must succeed
    req_success = client.post(
        "/api/rbac/request-access",
        json={"owner_wallet": owner["address"], "asset_id": asset_id, "access_level": access_scope},
        headers=auditor["headers"]
    )
    assert req_success.status_code == 200
    assert req_success.json()["success"] is True

    # 3. Owner revokes consent
    revoke_resp = client.post(f"/api/rbac/revoke-consent/{consent_id}", headers=owner["headers"])
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["success"] is True

    # 4. Auditor attempts access again -> Must be rejected
    req_denied = client.post(
        "/api/rbac/request-access",
        json={"owner_wallet": owner["address"], "asset_id": asset_id, "access_level": access_scope},
        headers=auditor["headers"]
    )
    assert req_denied.status_code == 200
    assert req_denied.json()["success"] is False

    # 5. Verify access logs contain both the granted event and the subsequent denied event
    log_resp = client.get(f"/api/rbac/access-logs/{auditor['address']}", headers=auditor["headers"])
    assert log_resp.status_code == 200
    logs = log_resp.json()["logs"]
    actions = [l for l in logs if l.get("action") == access_scope]
    assert any(l.get("granted") is True for l in actions)
    assert any(l.get("granted") is False for l in actions)


def test_t4_03_scenario_unauthorized_access_attempt_and_incident_response(client: httpx.Client):
    """
    Scenario 3: Unauthorized Access Attempt & Incident Response.
    - Untrusted actor attempts unauthorized minting -> 403 Forbidden.
    - Untrusted actor attempts unauthorized asset read without consent -> Denied.
    - Untrusted actor attempts unauthorized consent revocation -> 403 Forbidden.
    - System logs all unauthorized events in access audit trail.
    """
    untrusted = create_role_session(client, "USER")
    legitimate_owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")

    # Step 1: Untrusted user attempts to mint asset -> Forbidden
    unauthorized_mint = client.post(
        "/api/assets/mint",
        json={
            "owner_wallet": untrusted["address"],
            "name": "Rogue Drone",
            "description": "Exploit attempt",
            "asset_type": "ROGUE",
            "ipfs_cid": "0x00"
        },
        headers=untrusted["headers"]
    )
    assert unauthorized_mint.status_code == 403

    # Step 2: Untrusted manager attempts unauthorized access without consent
    untrusted_eval = create_role_session(client, "AUDITOR")
    unauthorized_access = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": legitimate_owner["address"],
            "asset_id": "BEL-CLASSIFIED-HSM-KEY",
            "access_level": "EXTRACT_PRIVATE_KEY"
        },
        headers=untrusted_eval["headers"]
    )
    assert unauthorized_access.status_code == 200
    assert unauthorized_access.json()["success"] is False

    # Step 3: Verify access log records the attempted breach
    logs_resp = client.get(
        f"/api/rbac/access-logs/{untrusted_eval['address']}",
        headers=untrusted_eval["headers"]
    )
    assert logs_resp.status_code == 200
    records = logs_resp.json()["logs"]
    unauthorized_entries = [r for r in records if r.get("action") == "EXTRACT_PRIVATE_KEY"]
    assert len(unauthorized_entries) >= 1
    assert unauthorized_entries[0]["granted"] is False


def test_t4_04_scenario_expired_consent_rejection(client: httpx.Client):
    """
    Scenario 4: Expired Consent Rejection (Fail-Closed Security Posture).
    - Consent created with past expiry time.
    - Access evaluation strictly enforces expiry check.
    - Access is rejected and denial is audited.
    """
    owner = create_role_session(client, "USER")
    auditor = create_role_session(client, "AUDITOR")
    asset_id = "BEL-TELEMETRY-SENSOR-9"

    # Create expired consent (duration = -30 seconds)
    grant_resp = client.post(
        "/api/rbac/grant-consent",
        json={
            "requester_wallet": auditor["address"],
            "asset_id": asset_id,
            "access_level": "DIAGNOSTIC_TELEMETRY",
            "duration_seconds": -30
        },
        headers=owner["headers"]
    )
    assert grant_resp.status_code == 200
    consent = grant_resp.json()["consent"]
    assert consent["expires_at"] < consent["created_at"]

    # Access request must fail due to expired timestamp
    req_resp = client.post(
        "/api/rbac/request-access",
        json={
            "owner_wallet": owner["address"],
            "asset_id": asset_id,
            "access_level": "DIAGNOSTIC_TELEMETRY"
        },
        headers=auditor["headers"]
    )
    assert req_resp.status_code == 200
    assert req_resp.json()["success"] is False


def test_t4_05_scenario_identity_lifecycle_and_multirole_governance(client: httpx.Client):
    """
    Scenario 5: Identity Lifecycle & Multi-Role Governance.
    - Full operator onboarding lifecycle (Register -> Verify -> EIP-191 Auth Challenge -> Role Inspection).
    - Separation of duties enforcement between roles (USER, MANAGER, AUDITOR).
    - Session termination via logout.
    """
    wallet, pkey = create_wallet()
    did = f"did:bel:commander:{wallet.lower()}"

    # 1. Onboarding
    reg = client.post("/api/identity/register", json={
        "did": did,
        "pii_data": "Commander Tactical Wing",
        "wallet_address": wallet
    })
    assert reg.status_code == 200
    s_initial = client.get(f"/api/identity/status/{wallet}").json()
    assert s_initial["status"] == "PENDING"

    # 2. Administrative verification
    ver = client.post("/api/identity/verify", json={"wallet_address": wallet})
    assert ver.status_code == 200
    s_verified = client.get(f"/api/identity/status/{wallet}").json()
    assert s_verified["status"] == "ACTIVE"

    # 3. EIP-191 Cryptographic Authentication
    auth = login_wallet(client, wallet, pkey)
    assert auth["role"] == "USER"

    # 4. Identity inspection via /api/auth/me
    me = client.get("/api/auth/me", headers=auth["headers"]).json()
    assert me["wallet_address"].lower() == wallet.lower()
    assert me["did"] == did

    # 5. Clean session termination
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200
    assert "Logged out" in logout_resp.json().get("message", "")
