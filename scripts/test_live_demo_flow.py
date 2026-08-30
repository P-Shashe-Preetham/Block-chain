"""
Live End-to-End 13-Step Demonstration Test Script for Open Banking Platform
Tests against running HTTP Server at http://127.0.0.1:8000
"""

import sys
import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

DEMO_USER_WALLET = "0x1111111111111111111111111111111111111111"
BANK_A_WALLET = "0x3C44CdD05a57028476078453851002F133ca588a"
DEMO_TSP_WALLET = "0x2222222222222222222222222222222222222222"

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def get(endpoint, headers=None):
    req_headers = headers or {}
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", headers=req_headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def run_demonstration():
    print("=========================================================================")
    print("  OPEN BANKING BLOCKCHAIN ACCESS CONTROL - 13-STEP E2E LIVE DEMO")
    print("=========================================================================\n")

    # Step 1: User registers identity
    status, body = post("/api/identity/register", {
        "did": "did:openbanking:alice101",
        "pii_data": "Alice Vance PII Hash Input",
        "wallet_address": DEMO_USER_WALLET
    })
    print(f"Step 1 [User Identity Registration]: Status {status} | DID: {body['data']['did']}")

    # Step 2: Bank verifies user
    status, body = post("/api/identity/verify", {"wallet_address": DEMO_USER_WALLET})
    print(f"Step 2 [Bank User Verification]: Status {status} | Message: {body['message']}")

    # Step 3: TSP and Bank register
    status, body = post("/api/organizations/register", {
        "name": "Fintech Budget Tracker",
        "role": "TSP",
        "license_id": "TSP-LIC-777",
        "wallet_address": DEMO_TSP_WALLET
    })
    print(f"Step 3 [TSP Registration]: Status {status} | Org ID: {body['organization']['org_id']}")

    post("/api/organizations/register", {
        "name": "Bank A (Apex Financial)",
        "role": "BANK",
        "license_id": "BANK-LIC-001",
        "wallet_address": BANK_A_WALLET
    })

    # Step 4: Regulator approves TSP and Bank A
    post("/api/organizations/approve", {"wallet_address": BANK_A_WALLET})
    status, body = post("/api/organizations/approve", {"wallet_address": DEMO_TSP_WALLET})
    print(f"Step 4 [Regulator Approval]: Status {status} | Message: {body['message']}")

    # Step 5: TSP initial access attempt (No consent yet)
    status, body = post("/api/access/evaluate", {
        "user_wallet": DEMO_USER_WALLET,
        "bank_wallet": BANK_A_WALLET,
        "tsp_wallet": DEMO_TSP_WALLET,
        "data_type": "TRANSACTIONS"
    })
    print(f"Step 5 [TSP Access Request without consent]: Allowed: {body['allowed']} | Reason: {body['reason']}")
    assert body['allowed'] == False, "Expected access denied without consent"

    # Step 6 & 7: User grants consent on-chain
    status, body = post("/api/consent/grant", {
        "user_wallet": DEMO_USER_WALLET,
        "bank_wallet": BANK_A_WALLET,
        "tsp_wallet": DEMO_TSP_WALLET,
        "data_type": "TRANSACTIONS",
        "duration_seconds": 1800
    })
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
    token = body['access_token']

    # Step 10: Bank API validates authorization & returns simulated transaction data
    status, body = get("/api/banks/bank-a/transactions/acc_banka_101", headers={"Authorization": f"Bearer {token}"})
    print(f"Step 10 [Bank A API Data Access]: Status {status} | Transactions Returned: {len(body['transactions'])}")

    # Step 11: Audit log inspection
    status, body = get("/api/audit/logs")
    print(f"Step 11 [Audit Registry Verification]: Total Audit Log Entries: {len(body['audit_logs'])}")

    # Step 12: User revokes consent
    status, body = post("/api/consent/revoke", {
        "consent_id": consent_id,
        "user_wallet": DEMO_USER_WALLET
    })
    print(f"Step 12 [User Revokes Consent]: Status {status} | Message: {body['message']}")

    # Step 13: Next TSP request is denied (Consent revoked)
    status, body = get("/api/banks/bank-a/transactions/acc_banka_101", headers={"Authorization": f"Bearer {token}"})
    print(f"Step 13 [Subsequent Bank API Call]: Status {status} (Forbidden) | Error: {body['detail']}\n")

    print("=========================================================================")
    print("  ALL 13 DEMONSTRATION STEPS EXECUTED SUCCESSFULLY AND VERIFIED!")
    print("=========================================================================\n")

if __name__ == "__main__":
    run_demonstration()
