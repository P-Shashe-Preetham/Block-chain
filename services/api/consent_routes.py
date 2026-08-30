"""
Consent Management API Routes (Phase 3)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db

router = APIRouter()

class GrantConsentRequest(BaseModel):
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str  # ACCOUNT_INFO, BALANCE, TRANSACTIONS
    duration_seconds: int = 3600

class RevokeConsentRequest(BaseModel):
    consent_id: str
    user_wallet: str

@router.post("/api/consent/grant")
def grant_consent(req: GrantConsentRequest):
    consent = blockchain_service.grant_consent(
        req.user_wallet, req.bank_wallet, req.tsp_wallet, req.data_type, req.duration_seconds
    )
    return {"success": True, "consent": consent.model_dump()}

@router.post("/api/consent/revoke")
def revoke_consent(req: RevokeConsentRequest):
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
