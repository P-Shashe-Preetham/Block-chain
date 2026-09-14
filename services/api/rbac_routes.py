import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from dataclasses import asdict
from datetime import datetime

from services.api.database.connection import db
from services.api.database.models import ConsentRecord, AccessLog
from services.api.auth import require_role, get_current_user

router = APIRouter()

class AccessRequest(BaseModel):
    owner_wallet: str
    asset_id: Optional[str]
    access_level: str

@router.post("/api/rbac/request-access")
def request_access(req: AccessRequest, current_user: dict = Depends(require_role("MANAGER", "AUDITOR"))):
    requester_wallet = current_user["wallet"]
    
    # Check if access is already allowed via consents
    is_allowed = False
    for consent in db.consents.values():
        if (consent.user_wallet.lower() == req.owner_wallet.lower() and
            consent.tsp_wallet.lower() == requester_wallet.lower() and
            (consent.bank_wallet == "" or consent.bank_wallet == (req.asset_id or "")) and
            consent.data_type == req.access_level and
            consent.active and consent.expires_at > time.time()):
            is_allowed = True
            break
            
    # Try to find token_id from asset_id for the log
    token_id = 0
    if req.asset_id:
        for asset in db.assets.values():
            if asset.asset_id == req.asset_id:
                token_id = asset.token_id
                break
    
    log = AccessLog(
        log_id=f"log_{len(db.access_logs) + 1}",
        requester_wallet=requester_wallet.lower(),
        token_id=token_id,
        action=req.access_level,
        granted=is_allowed,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )
    db.access_logs.append(log)

    if not is_allowed:
        return {"success": False, "message": "Access denied. Consent required."}

    return {"success": True, "message": "Access granted"}

class GrantConsentRequest(BaseModel):
    requester_wallet: str
    asset_id: Optional[str]
    access_level: str
    duration_seconds: int = 3600

@router.post("/api/rbac/grant-consent")
def grant_consent(req: GrantConsentRequest, current_user: dict = Depends(require_role("USER", "ADMIN"))):
    owner_wallet = current_user["wallet"]
    consent_id = f"cst_{len(db.consents) + 1}"
    now = int(time.time())
    
    consent = ConsentRecord(
        consent_id=consent_id,
        user_wallet=owner_wallet.lower(),
        bank_wallet=req.asset_id or "",
        tsp_wallet=req.requester_wallet.lower(),
        data_type=req.access_level,
        created_at=now,
        expires_at=now + req.duration_seconds,
        active=True
    )
    db.consents[consent_id] = consent
    return {"success": True, "consent": consent.model_dump()}

@router.get("/api/rbac/access-logs/{wallet_address}")
def get_access_logs(wallet_address: str, current_user: dict = Depends(require_role("USER", "AUDITOR", "ADMIN", "MANAGER"))):
    logs = []
    for log in db.access_logs:
        is_owner = False
        if log.token_id in db.assets:
            if db.assets[log.token_id].owner_wallet.lower() == wallet_address.lower():
                is_owner = True
                
        if current_user["role"] == "AUDITOR" or \
           log.requester_wallet.lower() == wallet_address.lower() or is_owner:
            logs.append(asdict(log))
    return {"logs": logs}

@router.post("/api/rbac/revoke-consent/{consent_id}")
def revoke_consent(consent_id: str, current_user: dict = Depends(require_role("USER", "ADMIN"))):
    owner_wallet = current_user["wallet"]
    consent = db.consents.get(consent_id)
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
    if consent.user_wallet.lower() != owner_wallet.lower():
        raise HTTPException(status_code=403, detail="Not authorized to revoke this consent")
    
    consent.active = False
    return {"success": True, "message": "Consent revoked successfully"}

@router.get("/api/rbac/consents/{wallet_address}")
def list_consents(wallet_address: str, current_user: dict = Depends(require_role("USER", "ADMIN", "MANAGER"))):
    if current_user["wallet"].lower() != wallet_address.lower() and current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view these consents")
    
    consents = []
    for consent in db.consents.values():
        if consent.active and (consent.user_wallet.lower() == wallet_address.lower() or consent.tsp_wallet.lower() == wallet_address.lower()):
            consents.append(consent.model_dump())
    return {"consents": consents}
