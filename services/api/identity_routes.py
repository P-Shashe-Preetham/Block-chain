"""
Identity Management API Routes (Phase 2).
Enforces cryptographic verification of DID registration and verifier authority.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db
from services.api.database.seed_data import BANK_A_WALLET, BANK_B_WALLET, BANK_C_WALLET, REGULATOR_WALLET
from services.api.signature_verifier import verify_personal_signature, recover_personal_signature

router = APIRouter()

AUTHORIZED_VERIFIERS = {
    BANK_A_WALLET.lower(),
    BANK_B_WALLET.lower(),
    BANK_C_WALLET.lower(),
    REGULATOR_WALLET.lower(),
}


class RegisterIdentityRequest(BaseModel):
    did: str
    pii_data: str
    wallet_address: str
    signature: Optional[str] = Field(None, description="ECDSA signature proving wallet ownership")


class VerifyIdentityRequest(BaseModel):
    wallet_address: str
    verifier_wallet: Optional[str] = Field(None, description="Wallet address of the bank/regulator verifier")
    signature: Optional[str] = Field(None, description="ECDSA signature from an authorized verifier/bank")


@router.post("/api/identity/register")
def register_identity(
    req: RegisterIdentityRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    sig = req.signature or x_signature
    if not sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing cryptographic signature. X-Signature header or signature field is required.",
        )

    canonical_message = f"RegisterIdentity:{req.wallet_address.lower()}:{req.did}"
    if not verify_personal_signature(req.wallet_address, canonical_message, sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cryptographic signature for wallet_address. Identity registration rejected.",
        )

    record = blockchain_service.register_identity(req.did, req.pii_data, req.wallet_address)
    return {"success": True, "data": record}


@router.post("/api/identity/verify")
def verify_identity(
    req: VerifyIdentityRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    sig = req.signature or x_signature
    if not sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing verifier cryptographic signature. X-Signature header or signature field is required.",
        )

    canonical_message = f"VerifyIdentity:{req.wallet_address.lower()}"
    signer = recover_personal_signature(canonical_message, sig)

    if not signer or signer not in AUTHORIZED_VERIFIERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signer is not an authorized bank or regulator verifier.",
        )

    success = blockchain_service.verify_identity(req.wallet_address)
    if not success:
        raise HTTPException(status_code=404, detail="User wallet not found")
    return {"success": True, "message": f"Wallet {req.wallet_address} verified successfully and set to ACTIVE by {signer}."}


@router.get("/api/identity/status/{wallet_address}")
def get_identity_status(wallet_address: str):
    user = db.users.get(wallet_address)
    if not user:
        return {"registered": False, "status": "NONE"}
    status_val = user.get("status") if isinstance(user, dict) else getattr(user, "status", "UNKNOWN")
    did_val = user.get("did") if isinstance(user, dict) else getattr(user, "did", "")
    return {"registered": True, "status": status_val, "did": did_val, "wallet_address": wallet_address}