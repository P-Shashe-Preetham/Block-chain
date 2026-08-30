"""
Organization & Role Foundation API Routes (Phase 1)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db

router = APIRouter()

class RegisterOrgRequest(BaseModel):
    name: str
    role: str  # BANK, TSP, REGULATOR
    license_id: str
    wallet_address: str

class UpdateOrgStatusRequest(BaseModel):
    wallet_address: str

@router.post("/api/organizations/register")
def register_organization(req: RegisterOrgRequest):
    if req.role not in ["BANK", "TSP", "REGULATOR"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be BANK, TSP, or REGULATOR.")
    org = blockchain_service.register_organization(req.name, req.role, req.license_id, req.wallet_address)
    return {"success": True, "organization": org}

@router.post("/api/organizations/approve")
def approve_organization(req: UpdateOrgStatusRequest):
    success = blockchain_service.approve_organization(req.wallet_address)
    if not success:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"success": True, "message": f"Organization {req.wallet_address} approved by Regulator."}

@router.get("/api/organizations/list")
def list_organizations():
    org_list = []
    for org in db.organizations.values():
        org_dict = org if isinstance(org, dict) else org.model_dump()
        org_list.append(org_dict)
    return {"organizations": org_list}
