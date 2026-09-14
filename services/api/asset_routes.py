"""
Digital Asset API Routes.
Manages minting, transferring, and querying digital assets (ERC-721).
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from dataclasses import asdict
from datetime import datetime

from services.api.blockchain_service import blockchain_service
from services.api.database.connection import db
from services.api.auth import require_role, get_current_user
from services.api.database.models import Asset

router = APIRouter()

class MintAssetRequest(BaseModel):
    owner_wallet: str
    name: str
    description: str
    asset_type: str
    ipfs_cid: str

@router.get("/api/assets")
@router.get("/api/assets/{wallet_address}")
def get_assets(wallet_address: Optional[str] = None, current_user: dict = Depends(require_role("ADMIN", "MANAGER", "USER", "AUDITOR"))):
    target_wallet = wallet_address or current_user.get("wallet")
    if target_wallet:
        assets_list = [asdict(a) for a in db.assets.values() if a.owner_wallet.lower() == target_wallet.lower()]
    else:
        assets_list = [asdict(a) for a in db.assets.values()]
    return {"assets": assets_list}

@router.post("/api/assets/mint")
def mint_asset(req: MintAssetRequest, current_user: dict = Depends(require_role("ADMIN", "MANAGER"))):
    # Mock storing in db.assets and return a mock tx hash
    token_id = len(db.assets) + 1
    asset = Asset(
        token_id=token_id,
        asset_id=f"BEL-ASSET-{token_id}",
        metadata_hash=req.ipfs_cid,
        owner_wallet=req.owner_wallet.lower(),
        status="ACTIVE",
        minted_at=datetime.utcnow().isoformat() + "Z"
    )
    db.assets[token_id] = asset
    
    return {
        "success": True,
        "asset": asdict(asset),
        "tx_hash": "0xmocktxhash1234567890abcdef"
    }
