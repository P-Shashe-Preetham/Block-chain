"""
Access Control Evaluation & JWT Issuance API Routes (Phase 4 & Phase 6)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.api.blockchain_service import blockchain_service
from services.api.jwt_service import jwt_service
from services.api.database.connection import db

router = APIRouter()

class RequestAccessRequest(BaseModel):
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str

@router.post("/api/access/evaluate")
def evaluate_access(req: RequestAccessRequest):
    allowed, reason = blockchain_service.is_access_allowed(
        req.user_wallet, req.bank_wallet, req.tsp_wallet, req.data_type
    )

    audit_log = blockchain_service.log_audit_event(
        req.user_wallet, req.bank_wallet, req.tsp_wallet, req.data_type, allowed, reason
    )

    if not allowed:
        return {"allowed": False, "reason": reason, "audit_log": audit_log.model_dump()}

    consent_id = "cst_active"
    for c in db.consents.values():
        if (
            c.user_wallet.lower() == req.user_wallet.lower()
            and c.bank_wallet.lower() == req.bank_wallet.lower()
            and c.tsp_wallet.lower() == req.tsp_wallet.lower()
            and c.data_type.upper() == req.data_type.upper()
            and c.active
        ):
            consent_id = c.consent_id
            break

    token = jwt_service.create_token(
        req.user_wallet, req.bank_wallet, req.tsp_wallet, req.data_type, consent_id, ttl_seconds=900
    )

    return {
        "allowed": True,
        "reason": reason,
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": 900,
        "audit_log": audit_log.model_dump()
    }
