"""
Comprehensive Security & API Integration Test Suite for Open Banking Backend.
Verifies cryptographic signature enforcement (EIP-191/712), BOLA/IDOR protection,
scope/audience enforcement, and asymmetric ES256 JWT tokens.
"""

import unittest
from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi.testclient import TestClient

from services.api.open_banking_app import app
from services.api.database.connection import db
from services.api.database.seed_data import (
    seed_database,
    USER1_WALLET,
    BANK_A_WALLET,
    TSP_1_WALLET,
    REGULATOR_WALLET,
)

# Standard Hardhat Test Private Keys
REGULATOR_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
USER1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"


def sign_message(message_text: str, private_key: str) -> str:
    signable = encode_defunct(text=message_text)
    signed = Account.sign_message(signable, private_key)
    return signed.signature.hex()


class TestOpenBankingSecurityAndAPI(unittest.TestCase):
    def setUp(self):
        seed_database()
        self.client = TestClient(app)

    def test_01_health_check(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_02_organization_registration_and_regulator_approval(self):
        # 1. Register new organization without signature -> must be 401 Unauthorized
        unauth_res = self.client.post("/api/organizations/register", json={
            "name": "Fintech Alpha",
            "role": "TSP",
            "license_id": "TSP-888",
            "wallet_address": "0x1234567890123456789012345678901234567890"
        })
        self.assertEqual(unauth_res.status_code, 401)

        # 2. Register new organization with valid signature
        org_account = Account.create()
        reg_msg = f"RegisterOrganization:{org_account.address.lower()}:Fintech Alpha:TSP:TSP-888"
        org_sig = sign_message(reg_msg, org_account.key.hex())

        res = self.client.post("/api/organizations/register", json={
            "name": "Fintech Alpha",
            "role": "TSP",
            "license_id": "TSP-888",
            "wallet_address": org_account.address,
            "signature": org_sig,
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # 3. Approve organization without regulator signature -> must be 401 Unauthorized
        fake_account = Account.create()
        fake_appr_msg = f"ApproveOrganization:{org_account.address.lower()}"
        fake_sig = sign_message(fake_appr_msg, fake_account.key.hex())
        bad_approve_res = self.client.post("/api/organizations/approve", json={
            "wallet_address": org_account.address,
            "signature": fake_sig,
        })
        self.assertEqual(bad_approve_res.status_code, 401)

        # 4. Approve organization with authorized regulator signature -> 200 OK
        reg_appr_msg = f"ApproveOrganization:{org_account.address.lower()}"
        reg_sig = sign_message(reg_appr_msg, REGULATOR_PRIVATE_KEY)
        approve_res = self.client.post("/api/organizations/approve", json={
            "wallet_address": org_account.address,
            "signature": reg_sig,
        })
        self.assertEqual(approve_res.status_code, 200)

    def test_03_identity_registration_and_verification(self):
        # 1. Register User without signature -> must be 401 Unauthorized
        bad_reg = self.client.post("/api/identity/register", json={
            "did": "did:openbanking:alice",
            "pii_data": "Alice Vance PII",
            "wallet_address": USER1_WALLET,
        })
        self.assertEqual(bad_reg.status_code, 401)

        # 2. Register User with valid signature
        reg_msg = f"RegisterIdentity:{USER1_WALLET.lower()}:did:openbanking:alice"
        user_sig = sign_message(reg_msg, USER1_PRIVATE_KEY)

        res = self.client.post("/api/identity/register", json={
            "did": "did:openbanking:alice",
            "pii_data": "Alice Vance PII",
            "wallet_address": USER1_WALLET,
            "signature": user_sig,
        })
        self.assertEqual(res.status_code, 200)

        # 3. Verify User Identity without verifier signature -> 401
        bad_v = self.client.post("/api/identity/verify", json={
            "wallet_address": USER1_WALLET,
        })
        self.assertEqual(bad_v.status_code, 401)

        # 4. Verify User Identity with authorized regulator signature
        verify_msg = f"VerifyIdentity:{USER1_WALLET.lower()}"
        reg_verify_sig = sign_message(verify_msg, REGULATOR_PRIVATE_KEY)
        v_res = self.client.post("/api/identity/verify", json={
            "wallet_address": USER1_WALLET,
            "signature": reg_verify_sig,
        })
        self.assertEqual(v_res.status_code, 200)

        # Check status
        status_res = self.client.get(f"/api/identity/status/{USER1_WALLET}")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()["status"], "ACTIVE")

    def test_04_consent_grant_and_access_evaluation(self):
        # 1. Grant consent without signature -> 401 Unauthorized
        bad_grant = self.client.post("/api/consent/grant", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO",
            "duration_seconds": 3600,
        })
        self.assertEqual(bad_grant.status_code, 401)

        # 2. Grant Consent for Bank A Account Info with valid signature
        grant_msg = f"GrantConsent:{USER1_WALLET.lower()}:{BANK_A_WALLET.lower()}:{TSP_1_WALLET.lower()}:ACCOUNT_INFO:3600"
        user_grant_sig = sign_message(grant_msg, USER1_PRIVATE_KEY)
        grant_res = self.client.post("/api/consent/grant", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO",
            "duration_seconds": 3600,
            "signature": user_grant_sig,
        })
        self.assertEqual(grant_res.status_code, 200)

        # 3. Evaluate Access & Get Asymmetric ES256 JWT Token
        eval_res = self.client.post("/api/access/evaluate", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO",
        })
        self.assertEqual(eval_res.status_code, 200)
        self.assertTrue(eval_res.json()["allowed"])
        token = eval_res.json()["access_token"]

        # 4. Fetch Bank A Accounts with Token -> 200 OK
        accounts_res = self.client.get("/api/banks/bank-a/accounts", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(accounts_res.status_code, 200)
        self.assertEqual(len(accounts_res.json()["accounts"]), 1)
        account_id = accounts_res.json()["accounts"][0]["account_id"]

        # 5. SCOPE MISMATCH TEST: Try to access TRANSACTIONS endpoint using ACCOUNT_INFO token -> must be 403
        scope_mismatch_res = self.client.get(f"/api/banks/bank-a/transactions/{account_id}", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(scope_mismatch_res.status_code, 403)
        self.assertIn("scope", scope_mismatch_res.json()["detail"].lower())

    def test_05_bola_idor_protection(self):
        # 1. Grant consent for TRANSACTIONS
        grant_tx_msg = f"GrantConsent:{USER1_WALLET.lower()}:{BANK_A_WALLET.lower()}:{TSP_1_WALLET.lower()}:TRANSACTIONS:3600"
        user_grant_tx_sig = sign_message(grant_tx_msg, USER1_PRIVATE_KEY)
        self.client.post("/api/consent/grant", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "TRANSACTIONS",
            "duration_seconds": 3600,
            "signature": user_grant_tx_sig,
        })

        eval_tx_res = self.client.post("/api/access/evaluate", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "TRANSACTIONS",
        })
        tx_token = eval_tx_res.json()["access_token"]

        # User 1 legitimately queries their own account (acc_banka_101)
        valid_res = self.client.get("/api/banks/bank-a/transactions/acc_banka_101", headers={
            "Authorization": f"Bearer {tx_token}"
        })
        self.assertEqual(valid_res.status_code, 200)

        # IDOR ATTACK: User 1 attempts to query an account ID belonging to User 2 or a nonexistent account
        idor_res = self.client.get("/api/banks/bank-a/transactions/acc_banka_victim_999", headers={
            "Authorization": f"Bearer {tx_token}"
        })
        self.assertEqual(idor_res.status_code, 404)

    def test_06_consent_revocation_lifecycle(self):
        grant_msg = f"GrantConsent:{USER1_WALLET.lower()}:{BANK_A_WALLET.lower()}:{TSP_1_WALLET.lower()}:ACCOUNT_INFO:3600"
        user_grant_sig = sign_message(grant_msg, USER1_PRIVATE_KEY)
        grant_res = self.client.post("/api/consent/grant", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO",
            "duration_seconds": 3600,
            "signature": user_grant_sig,
        })
        consent_id = grant_res.json()["consent"]["consent_id"]

        eval_res = self.client.post("/api/access/evaluate", json={
            "user_wallet": USER1_WALLET,
            "bank_wallet": BANK_A_WALLET,
            "tsp_wallet": TSP_1_WALLET,
            "data_type": "ACCOUNT_INFO",
        })
        token = eval_res.json()["access_token"]

        # Confirm token works before revocation
        res_before = self.client.get("/api/banks/bank-a/accounts", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(res_before.status_code, 200)

        # Revoke consent with signature
        revoke_msg = f"RevokeConsent:{consent_id}:{USER1_WALLET.lower()}"
        user_revoke_sig = sign_message(revoke_msg, USER1_PRIVATE_KEY)
        revoke_res = self.client.post("/api/consent/revoke", json={
            "consent_id": consent_id,
            "user_wallet": USER1_WALLET,
            "signature": user_revoke_sig,
        })
        self.assertEqual(revoke_res.status_code, 200)

        # Re-evaluating banking access after revocation must return 403
        res_after = self.client.get("/api/banks/bank-a/accounts", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(res_after.status_code, 403)


if __name__ == "__main__":
    unittest.main()