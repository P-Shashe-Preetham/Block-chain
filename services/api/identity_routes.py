"""
Identity Management API Routes (Phase 2)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db

router = APIRouter()

class RegisterIdentityRequest(BaseModel):
    did: str
    pii_data: str
    wallet_address: str

class VerifyIdentityRequest(BaseModel):
    wallet_address: str

@router.post("/api/identity/register")
def register_identity(req: RegisterIdentityRequest):
    record = blockchain_service.register_identity(req.did, req.pii_data, req.wallet_address)
    return {"success": True, "data": record}

@router.post("/api/identity/verify")
def verify_identity(req: VerifyIdentityRequest):
    success = blockchain_service.verify_identity(req.wallet_address)
    if not success:
        raise HTTPException(status_code=404, detail="User wallet not found")
    return {"success": True, "message": f"Wallet {req.wallet_address} verified successfully and set to ACTIVE."}

@router.get("/api/identity/status/{wallet_address}")
def get_identity_status(wallet_address: str):
    user = db.users.get(wallet_address)
    if not user:
        return {"registered": False, "status": "NONE"}
    status = user.get("status") if isinstance(user, dict) else getattr(user, "status", "UNKNOWN")
    did = user.get("did") if isinstance(user, dict) else getattr(user, "did", "")
    return {"registered": True, "status": status, "did": did, "wallet_address": wallet_address}
