"""
Live End-to-End 13-Step Demonstration Test Script for Open Banking Platform.
Tests against running HTTP Server at http://127.0.0.1:8000, with transparent
in-process TestClient fallback if no HTTP server is currently active.
"""

from __future__ import annotations

import json
import sys
import urllib.request
import urllib.error
from eth_account import Account
from eth_account.messages import encode_defunct

# Canonical Hardhat test credentials
REGULATOR_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
REGULATOR_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

DEMO_USER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
DEMO_USER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

DEMO_TSP_WALLET = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
DEMO_TSP_KEY = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

# Seeded Bank A in the database that owns acc_banka_101
BANK_A_WALLET = "0x3C44CdD05a57028476078453851002F133ca588a"

BASE_URL = "http://127.0.0.1:8000"
_client = None


def sign_message(text: str, key: str) -> str:
    signable = encode_defunct(text=text)
    return Account.sign_message(signable, key).signature.hex()


def get_client():
    global _client
    if _client is not None:
        return _client
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/healthz", timeout=1)
        if req.status == 200:
            _client = "HTTP"
            return _client
    except Exception:
        pass

    # Fallback to in-process TestClient
    from fastapi.testclient import TestClient
    from services.api.open_banking_app import app
    from services.api.database.seed_data import seed_database

    seed_database()
    _client = TestClient(app)
    return _client


def post(endpoint: str, data: dict):
    client = get_client()
    if client == "HTTP":
        req = urllib.request.Request(
            f"{BASE_URL}{endpoint}",
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8"))
    else:
        resp = client.post(endpoint, json=data)
        try:
            body = resp.json()
        except Exception:
            body = {"detail": resp.text}
        return resp.status_code, body


def get(endpoint: str, headers: dict | None = None):
    client = get_client()
    if client == "HTTP":
        req_headers = headers or {}
        req = urllib.request.Request(f"{BASE_URL}{endpoint}", headers=req_headers)
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8"))
    else:
        resp = client.get(endpoint, headers=headers or {})
        try:
            body = resp.json()
        except Exception:
            body = {"detail": resp.text}
        return resp.status_code, body


def run_demonstration():
    print("=========================================================================")
    print("  OPEN BANKING BLOCKCHAIN ACCESS CONTROL - 13-STEP E2E LIVE DEMO")
    print("=========================================================================\n")

    # Step 1: User registers identity with signature
    reg_msg = f"RegisterIdentity:{DEMO_USER_WALLET.lower()}:did:openbanking:alice101"
    user_sig = sign_message(reg_msg, DEMO_USER_KEY)
    status, body = post("/api/identity/register", {
        "did": "did:openbanking:alice101",
        "pii_data": "Alice Vance PII Hash Input",
        "wallet_address": DEMO_USER_WALLET,
        "signature": user_sig,
    })
    print(f"Step 1 [User Identity Registration]: Status {status} | DID: {body.get('data', {}).get('did', 'did:openbanking:alice101')}")
    assert status == 200, f"Step 1 failed: {body}"

    # Step 2: Bank verifies user with regulator/verifier signature
    verify_msg = f"VerifyIdentity:{DEMO_USER_WALLET.lower()}"
    verify_sig = sign_message(verify_msg, REGULATOR_KEY)
    status, body = post("/api/identity/verify", {
        "wallet_address": DEMO_USER_WALLET,
        "signature": verify_sig,
    })
    print(f"Step 2 [Bank User Verification]: Status {status} | Message: {body.get('message', 'User verified')}")
    assert status == 200, f"Step 2 failed: {body}"

    # Step 3: TSP and Bank register with cryptographic signatures
    tsp_msg = f"RegisterOrganization:{DEMO_TSP_WALLET.lower()}:Fintech Budget Tracker:TSP:TSP-LIC-777"
    tsp_sig = sign_message(tsp_msg, DEMO_TSP_KEY)
    status, body = post("/api/organizations/register", {
        "name": "Fintech Budget Tracker",
        "role": "TSP",
        "license_id": "TSP-LIC-777",
        "wallet_address": DEMO_TSP_WALLET,
        "signature": tsp_sig,
    })
    print(f"Step 3 [TSP Registration]: Status {status} | Org ID: {body.get('organization', {}).get('org_id', 'org_tsp_1')}")
    assert status == 200, f"Step 3 TSP failed: {body}"

    new_bank = Account.create()
    bank_msg = f"RegisterOrganization:{new_bank.address.lower()}:Bank Neo:BANK:BANK-LIC-002"
    bank_sig = sign_message(bank_msg, new_bank.key.hex())
    status, body = post("/api/organizations/register", {
        "name": "Bank Neo",
        "role": "BANK",
        "license_id": "BANK-LIC-002",
        "wallet_address": new_bank.address,
        "signature": bank_sig,
    })
    assert status == 200, f"Step 3 Bank failed: {body}"
    print(f"Step 3 [Bank Registration]: Status {status} | Org ID: {body.get('organization', {}).get('org_id')}")

    # Step 4: Regulator approves TSP and Bank
    for w in [new_bank.address, DEMO_TSP_WALLET]:
        appr_msg = f"ApproveOrganization:{w.lower()}"
        appr_sig = sign_message(appr_msg, REGULATOR_KEY)
        status, body = post("/api/organizations/approve", {"wallet_address": w, "signature": appr_sig})
        assert status == 200, f"Step 4 approval failed for {w}: {body}"
    print(f"Step 4 [Regulator Approval]: Status {status} | Message: {body.get('message', 'Organization approved')}")

    # Step 5: TSP initial access attempt (No consent yet)
    status, body = post("/api/access/evaluate", {
        "user_wallet": DEMO_USER_WALLET,
        "bank_wallet": BANK_A_WALLET,
        "tsp_wallet": DEMO_TSP_WALLET,
        "data_type": "TRANSACTIONS"
    })
    print(f"Step 5 [TSP Access Request without consent]: Allowed: {body['allowed']} | Reason: {body.get('reason', 'No active consent')}")
    assert body['allowed'] is False, "Expected access denied without consent"

    # Step 6 & 7: User grants consent on-chain with signature
    consent_msg = f"GrantConsent:{DEMO_USER_WALLET.lower()}:{BANK_A_WALLET.lower()}:{DEMO_TSP_WALLET.lower()}:TRANSACTIONS:1800"
    consent_sig = sign_message(consent_msg, DEMO_USER_KEY)
    status, body = post("/api/consent/grant", {
        "user_wallet": DEMO_USER_WALLET,
        "bank_wallet": BANK_A_WALLET,
        "tsp_wallet": DEMO_TSP_WALLET,
        "data_type": "TRANSACTIONS",
        "duration_seconds": 1800,
        "signature": consent_sig,
    })
    assert status == 200, f"Step 6 & 7 failed: {body}"
    consent_id = body['consent']['consent_id']
    print(f"Step 6 & 7 [User Consent Granted]: Status {status} | Consent ID: {consent_id}")

    # Step 8 & 9: TSP requests token & AccessControlManager evaluates access
    status, body = post("/api/access/evaluate", {
        "user_wallet": DEMO_USER_WALLET,
        "bank_wallet": BANK_A_WALLET,
        "tsp_wallet": DEMO_TSP_WALLET,
        "data_type": "TRANSACTIONS"
    })
    print(f"Step 8 & 9 [Access Control Approval & JWT Token Issuance]: Allowed: {body['allowed']} | Token Type: {body.get('token_type', 'Bearer')}")
    assert body['allowed'] is True, "Expected access granted with valid consent"
    token = body['access_token']

    # Step 10: Bank API validates authorization & returns simulated transaction data (BOLA protected)
    status, body = get("/api/banks/bank-a/transactions/acc_banka_101", headers={"Authorization": f"Bearer {token}"})
    print(f"Step 10 [Bank A API Data Access]: Status {status} | Transactions Returned: {len(body.get('transactions', []))}")
    assert status == 200, f"Expected 200 OK for account owner, got {status}: {body}"

    # Step 11: Audit log inspection
    status, body = get("/api/audit/logs")
    print(f"Step 11 [Audit Registry Verification]: Total Audit Log Entries: {len(body.get('audit_logs', []))}")
    assert status == 200, f"Step 11 failed: {body}"

    # Step 12: User revokes consent with signature (canonical format: RevokeConsent:consent_id:user_wallet)
    revoke_msg = f"RevokeConsent:{consent_id}:{DEMO_USER_WALLET.lower()}"
    revoke_sig = sign_message(revoke_msg, DEMO_USER_KEY)
    status, body = post("/api/consent/revoke", {
        "consent_id": consent_id,
        "user_wallet": DEMO_USER_WALLET,
        "signature": revoke_sig,
    })
    print(f"Step 12 [User Revokes Consent]: Status {status} | Message: {body.get('message', 'Consent revoked')}")
    assert status == 200, f"Step 12 revoke failed: {body}"

    # Step 13: Next TSP request is denied (Consent revoked)
    status, body = get("/api/banks/bank-a/transactions/acc_banka_101", headers={"Authorization": f"Bearer {token}"})
    print(f"Step 13 [Subsequent Bank API Call]: Status {status} (Forbidden) | Detail: {body.get('detail', 'Revoked')}\n")
    assert status == 403, f"Expected 403 Forbidden after consent revocation, got {status}"

    print("=========================================================================")
    print("  ALL 13 DEMONSTRATION STEPS EXECUTED SUCCESSFULLY AND VERIFIED!")
    print("=========================================================================\n")


if __name__ == "__main__":
    run_demonstration()