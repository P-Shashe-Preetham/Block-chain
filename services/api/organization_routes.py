"""
Organization & Role Foundation API Routes (Phase 1).
Enforces cryptographic proof of organization identity and regulator approval authority.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db
from services.api.database.seed_data import REGULATOR_WALLET
from services.api.signature_verifier import verify_personal_signature, recover_personal_signature

router = APIRouter()


class RegisterOrgRequest(BaseModel):
    name: str
    role: str  # BANK, TSP, REGULATOR
    license_id: str
    wallet_address: str
    signature: Optional[str] = Field(None, description="ECDSA signature proving organization wallet ownership")


class UpdateOrgStatusRequest(BaseModel):
    wallet_address: str
    signature: Optional[str] = Field(None, description="ECDSA signature from the regulator authority")


@router.post("/api/organizations/register")
def register_organization(
    req: RegisterOrgRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    if req.role not in ["BANK", "TSP", "REGULATOR"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be BANK, TSP, or REGULATOR.")

    sig = req.signature or x_signature
    if not sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing cryptographic signature. X-Signature header or signature field is required.",
        )

    canonical_message = f"RegisterOrganization:{req.wallet_address.lower()}:{req.name}:{req.role}:{req.license_id}"
    if not verify_personal_signature(req.wallet_address, canonical_message, sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cryptographic signature for organization wallet.",
        )

    org = blockchain_service.register_organization(req.name, req.role, req.license_id, req.wallet_address)
    return {"success": True, "organization": org}


@router.post("/api/organizations/approve")
def approve_organization(
    req: UpdateOrgStatusRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    sig = req.signature or x_signature
    if not sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing regulator cryptographic signature. X-Signature header or signature field is required.",
        )

    canonical_message = f"ApproveOrganization:{req.wallet_address.lower()}"
    signer = recover_personal_signature(canonical_message, sig)

    if not signer or signer.lower() != REGULATOR_WALLET.lower():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signer is not the authorized regulator authority.",
        )

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