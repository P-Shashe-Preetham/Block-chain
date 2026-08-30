"""
Simulated Banking APIs (Phase 5) - Bank A (Apex), Bank B (Beacon), Bank C (Crest)
Validates JWT Token AND re-evaluates Blockchain Consent before returning banking data.
"""

from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from services.api.database.connection import db
from services.api.jwt_service import jwt_service
from services.api.blockchain_service import blockchain_service

router = APIRouter()

def _verify_authorization(authorization: Optional[str], requested_bank_id: str, requested_data_type: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header. Bearer token required.")

    token = authorization.split(" ")[1]
    valid, payload, message = jwt_service.verify_token(token)

    if not valid or not payload:
        raise HTTPException(status_code=401, detail=f"JWT Authorization Failed: {message}")

    user_wallet = payload["sub"]
    bank_wallet = payload["bank_wallet"]
    tsp_wallet = payload["tsp_wallet"]
    data_type = payload["data_type"]

    has_live_consent = blockchain_service.check_consent(user_wallet, bank_wallet, tsp_wallet, data_type)
    if not has_live_consent:
        blockchain_service.log_audit_event(
            user_wallet, bank_wallet, tsp_wallet, data_type, False, "Revoked or expired consent during bank API call"
        )
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Consent was revoked or expired on the blockchain since token issuance."
        )

    return payload

@router.get("/api/banks/bank-a/accounts")
def get_bank_a_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_A", "ACCOUNT_INFO")
    user_wallet = payload["sub"]

    accounts = [acc.model_dump() for acc in db.accounts.values() if acc.bank_id == "BANK_A" and acc.user_wallet.lower() == user_wallet.lower()]
    return {"bank": "Bank A (Apex Financial)", "user_wallet": user_wallet, "accounts": accounts}

@router.get("/api/banks/bank-a/transactions/{account_id}")
def get_bank_a_transactions(account_id: str, authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_A", "TRANSACTIONS")
    txs = db.transactions.get(account_id, [])
    return {"bank": "Bank A (Apex Financial)", "account_id": account_id, "transactions": [tx.model_dump() for tx in txs]}

@router.get("/api/banks/bank-b/accounts")
def get_bank_b_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_B", "ACCOUNT_INFO")
    user_wallet = payload["sub"]

    accounts = [acc.model_dump() for acc in db.accounts.values() if acc.bank_id == "BANK_B" and acc.user_wallet.lower() == user_wallet.lower()]
    return {"bank": "Bank B (Beacon Trust)", "user_wallet": user_wallet, "accounts": accounts}

@router.get("/api/banks/bank-c/accounts")
def get_bank_c_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_C", "ACCOUNT_INFO")
    user_wallet = payload["sub"]

    accounts = [acc.model_dump() for acc in db.accounts.values() if acc.bank_id == "BANK_C" and acc.user_wallet.lower() == user_wallet.lower()]
    return {"bank": "Bank C (Crest Capital)", "user_wallet": user_wallet, "accounts": accounts}
