"""
Simulated Banking APIs (Phase 5) - Bank A (Apex), Bank B (Beacon), Bank C (Crest).
Validates asymmetric JWT tokens, enforces strict scope & audience matching,
prevents BOLA/IDOR by validating account ownership, and re-evaluates live blockchain consent.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status

from services.api.database.connection import db
from services.api.database.seed_data import BANK_A_WALLET, BANK_B_WALLET, BANK_C_WALLET
from services.api.jwt_service import jwt_service
from services.api.blockchain_service import blockchain_service

router = APIRouter()

BANK_WALLET_MAP = {
    "BANK_A": BANK_A_WALLET.lower(),
    "BANK_B": BANK_B_WALLET.lower(),
    "BANK_C": BANK_C_WALLET.lower(),
}


def _verify_authorization(
    authorization: Optional[str], requested_bank_id: str, requested_data_type: str
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Bearer token required.",
        )

    token = authorization.split(" ")[1].strip()
    target_bank_wallet = BANK_WALLET_MAP.get(requested_bank_id)
    valid, payload, message = jwt_service.verify_token(token, expected_audience=target_bank_wallet)

    if not valid or not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT Authorization Failed: {message}",
        )

    # 1. Enforce strict scope matching (BFLA protection)
    token_scope = payload.get("data_type", "").upper()
    if token_scope != requested_data_type.upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Token scope '{token_scope}' does not grant permission for '{requested_data_type}'.",
        )

    # 2. Enforce audience and bank wallet matching
    token_bank_wallet = payload.get("bank_wallet", "").lower()
    if target_bank_wallet and token_bank_wallet != target_bank_wallet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Token was not issued for the target bank institution.",
        )

    user_wallet = payload["sub"]
    tsp_wallet = payload["tsp_wallet"]

    # 3. Live re-check on blockchain consent
    has_live_consent = blockchain_service.check_consent(
        user_wallet, token_bank_wallet, tsp_wallet, token_scope
    )
    if not has_live_consent:
        blockchain_service.log_audit_event(
            user_wallet,
            token_bank_wallet,
            tsp_wallet,
            token_scope,
            False,
            "Revoked or expired consent during bank API call",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Consent was revoked or expired on the blockchain since token issuance.",
        )

    return payload


@router.get("/api/banks/bank-a/accounts")
def get_bank_a_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_A", "ACCOUNT_INFO")
    user_wallet = payload["sub"].lower()

    accounts = [
        acc.model_dump()
        for acc in db.accounts.values()
        if acc.bank_id == "BANK_A" and acc.user_wallet.lower() == user_wallet
    ]
    return {"bank": "Bank A (Apex Financial)", "user_wallet": user_wallet, "accounts": accounts}


@router.get("/api/banks/bank-a/transactions/{account_id}")
def get_bank_a_transactions(account_id: str, authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_A", "TRANSACTIONS")
    user_wallet = payload["sub"].lower()

    # BOLA / IDOR Verification: ensure target account belongs to the authorized user
    account = db.accounts.get(account_id)
    if not account or account.user_wallet.lower() != user_wallet or account.bank_id != "BANK_A":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access unauthorized for the authenticated wallet.",
        )

    txs = db.transactions.get(account_id, [])
    return {
        "bank": "Bank A (Apex Financial)",
        "account_id": account_id,
        "transactions": [tx.model_dump() for tx in txs],
    }


@router.get("/api/banks/bank-b/accounts")
def get_bank_b_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_B", "ACCOUNT_INFO")
    user_wallet = payload["sub"].lower()

    accounts = [
        acc.model_dump()
        for acc in db.accounts.values()
        if acc.bank_id == "BANK_B" and acc.user_wallet.lower() == user_wallet
    ]
    return {"bank": "Bank B (Beacon Trust)", "user_wallet": user_wallet, "accounts": accounts}


@router.get("/api/banks/bank-c/accounts")
def get_bank_c_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_C", "ACCOUNT_INFO")
    user_wallet = payload["sub"].lower()

    accounts = [
        acc.model_dump()
        for acc in db.accounts.values()
        if acc.bank_id == "BANK_C" and acc.user_wallet.lower() == user_wallet
    ]
    return {"bank": "Bank C (Crest Capital)", "user_wallet": user_wallet, "accounts": accounts}