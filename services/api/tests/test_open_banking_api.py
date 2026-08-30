"""
Comprehensive API Integration Test Suite for Open Banking Backend (Phases 1-6)
"""

import unittest
from fastapi.testclient import TestClient
from services.api.open_banking_app import app
from services.api.database.seed_data import USER1_WALLET, BANK_A_WALLET, TSP_1_WALLET

class TestOpenBankingAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_check(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_02_organization_routes(self):
        # Register new TSP
        res = self.client.post("/api/organizations/register", json={
            "name": "Fintech Alpha",
            "role": "TSP",
            "license_id": "TSP-888",
            "wallet_address": "0x1234567890123456789012345678901234567890"
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # Approve organization
        approve_res = self.client.post("/api/organizations/approve", json={
            "wallet_address": "0x1234567890123456789012345678901234567890"
        })
        self.assertEqual(approve_res.status_code, 200)

    def test_03_identity_routes(self):
        # Register User
        res = self.client.post("/api/identity/register", json={
            "did": "did:openbanking:alice",
            "pii_data": "Alice Vance PII",
            "wallet_address": USER1_WALLET
        })
        self.assertEqual(res.status_code, 200)

        # Verify User Identity
        v_res = self.client.post("/api/identity/verify", json={
            "wallet_address": USER1_WALLET
        })
        self.assertEqual(v_res.status_code, 200)

        # Check status
        status_res = self.client.get(f"/api/identity/status/{USER1_WALLET}")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()["status"], "ACTIVE")

    def test_04_full_access_and_bank_api_workflow(self):
        # 1. Grant Consent for Bank A Transactions
        grant_res = self.client.post("/api/consent/grant", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "TRANSACTIONS",
            "duration_seconds": 3600
        })
        self.assertEqual(grant_res.status_code, 200)
        consent_id = grant_res.json()["consent"]["consent_id"]

        # 2. Also Grant Consent for Bank A Account Info
        self.client.post("/api/consent/grant", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO",
            "duration_seconds": 3600
        })

        # 3. Evaluate Access & Get JWT Token for Account Info
        eval_res = self.client.post("/api/access/evaluate", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO"
        })
        self.assertEqual(eval_res.status_code, 200)
        self.assertTrue(eval_res.json()["allowed"])
        token = eval_res.json()["access_token"]

        # 4. Fetch Bank A Accounts with Token
        accounts_res = self.client.get("/api/banks/bank-a/accounts", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(accounts_res.status_code, 200)
        self.assertEqual(len(accounts_res.json()["accounts"]), 1)
        account_id = accounts_res.json()["accounts"][0]["account_id"]

        # 5. Evaluate Access & Get JWT Token for Transactions
        eval_tx_res = self.client.post("/api/access/evaluate", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "TRANSACTIONS"
        })
        tx_token = eval_tx_res.json()["access_token"]

        # 6. Fetch Transactions with Token
        tx_res = self.client.get(f"/api/banks/bank-a/transactions/{account_id}", headers={
            "Authorization": f"Bearer {tx_token}"
        })
        self.assertEqual(tx_res.status_code, 200)
        self.assertGreater(len(tx_res.json()["transactions"]), 0)

        # 7. User Revokes Consent
        revoke_res = self.client.post("/api/consent/revoke", json={
            "consent_id": consent_id,
            "user_wallet": USER1_WALLET
        })
        self.assertEqual(revoke_res.status_code, 200)

        # 8. Fetch Transactions after consent revocation should return 403 Forbidden!
        tx_res_denied = self.client.get(f"/api/banks/bank-a/transactions/{account_id}", headers={
            "Authorization": f"Bearer {tx_token}"
        })
        self.assertEqual(tx_res_denied.status_code, 403)

if __name__ == "__main__":
    unittest.main()
