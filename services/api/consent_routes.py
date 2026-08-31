"""
Consent Management API Routes (Phase 3).
Enforces cryptographic signature verification on grant and revoke actions.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db
from services.api.signature_verifier import verify_personal_signature

router = APIRouter()


class GrantConsentRequest(BaseModel):
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str  # ACCOUNT_INFO, BALANCE, TRANSACTIONS
    duration_seconds: int = 3600
    signature: Optional[str] = Field(None, description="ECDSA signature proving user_wallet ownership")


class RevokeConsentRequest(BaseModel):
    consent_id: str
    user_wallet: str
    signature: Optional[str] = Field(None, description="ECDSA signature proving user_wallet ownership")


@router.post("/api/consent/grant")
def grant_consent(
    req: GrantConsentRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    sig = req.signature or x_signature
    if not sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing cryptographic signature. X-Signature header or signature field is required.",
        )

    canonical_message = (
        f"GrantConsent:{req.user_wallet.lower()}:{req.bank_wallet.lower()}:"
        f"{req.tsp_wallet.lower()}:{req.data_type.upper()}:{req.duration_seconds}"
    )

    if not verify_personal_signature(req.user_wallet, canonical_message, sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cryptographic signature for user_wallet. Consent grant rejected.",
        )

    consent = blockchain_service.grant_consent(
        req.user_wallet, req.bank_wallet, req.tsp_wallet, req.data_type, req.duration_seconds
    )
    return {"success": True, "consent": consent.model_dump()}


@router.post("/api/consent/revoke")
def revoke_consent(
    req: RevokeConsentRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    sig = req.signature or x_signature
    if not sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing cryptographic signature. X-Signature header or signature field is required.",
        )

    canonical_message = f"RevokeConsent:{req.consent_id}:{req.user_wallet.lower()}"
    if not verify_personal_signature(req.user_wallet, canonical_message, sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cryptographic signature for user_wallet. Consent revocation rejected.",
        )

    success = blockchain_service.revoke_consent(req.consent_id, req.user_wallet)
    if not success:
        raise HTTPException(status_code=400, detail="Consent not found or caller unauthorized.")
    return {"success": True, "message": f"Consent {req.consent_id} revoked successfully."}


@router.get("/api/consent/user/{user_wallet}")
def get_user_consents(user_wallet: str):
    user_consents = []
    for c in db.consents.values():
        if c.user_wallet.lower() == user_wallet.lower():
            user_consents.append(c.model_dump())
    return {"consents": user_consents}