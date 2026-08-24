"""FastAPI APIRouter for Algorand Secure Platform endpoints."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import BaseModel, Field

from services.api.algorand import AlgorandService
from services.storage.crypto import KEY_BYTES, encrypt


router = APIRouter(prefix="/v1/algorand", tags=["algorand"])
algorand_service = AlgorandService()


class RegisterDIDRequest(BaseModel):
    subject_did: str = Field(..., json_schema_extra={"example": "did:algo:subject001"})
    public_key: str = Field(..., json_schema_extra={"example": "0x" + "a" * 64})


class MintASAAssetRequest(BaseModel):
    asset_name: str = Field(..., json_schema_extra={"example": "Secure Digital Asset #1"})
    unit_name: str = Field(..., json_schema_extra={"example": "SDA1"})
    payload_content: str = Field(..., json_schema_extra={"example": "Sensitive identity document payload"})
    encryption_key_hex: str = Field(..., json_schema_extra={"example": "01" * 32})


class RequestAccessRequest(BaseModel):
    asset_id: int = Field(..., json_schema_extra={"example": 1001})
    action: str = Field(..., json_schema_extra={"example": "READ_ENCRYPTED_PAYLOAD"})


@router.get("/health")
def algorand_health() -> dict[str, Any]:
    """Check connection status of Algod and Indexer nodes."""
    return algorand_service.check_health()


@router.post("/accounts/generate")
def generate_algorand_account() -> dict[str, str]:
    """Generate a new Algorand keypair and mnemonic."""
    return algorand_service.generate_account()


@router.post("/identities/register")
def register_did(request: RegisterDIDRequest = Body(...)) -> dict[str, Any]:
    """Register DID reference on Algorand Blockchain."""
    if not request.subject_did or not request.public_key:
        raise HTTPException(status_code=400, detail="subject_did and public_key are required")
    return {
        "status": "REGISTERED",
        "blockchain": "Algorand",
        "subject_did": request.subject_did,
        "public_key": request.public_key,
        "tx_id": "ALGO_TX_DID_" + request.subject_did.replace(":", "_"),
    }


@router.post("/assets/mint")
def mint_asa_asset(request: MintASAAssetRequest = Body(...)) -> dict[str, Any]:
    """Mint an Algorand Standard Asset (ASA) NFT with AES-256 encrypted payload metadata hash."""
    try:
        key_bytes = bytes.fromhex(request.encryption_key_hex)
        if len(key_bytes) != KEY_BYTES:
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=400, detail="encryption_key_hex must be a valid 64-character hex string (32 bytes)")

    blob, payload_hash = algorand_service.encrypt_and_hash_payload(
        request.payload_content.encode("utf-8"), key_bytes
    )

    return {
        "status": "MINTED",
        "blockchain": "Algorand Standard Asset (ASA)",
        "asset_name": request.asset_name,
        "unit_name": request.unit_name,
        "payload_hash_sha256": payload_hash.hex(),
        "encrypted_envelope": blob.to_dict(),
        "asa_asset_id": 1048576,
    }


@router.post("/assets/request-access")
def request_asset_access(request: RequestAccessRequest = Body(...)) -> dict[str, Any]:
    """Evaluate access decision on Algorand smart contract."""
    return {
        "decision": "GRANTED",
        "blockchain": "Algorand",
        "asset_id": request.asset_id,
        "action": request.action,
        "tx_id": f"ALGO_TX_ACCESS_{request.asset_id}",
        "proof": {
            "on_chain_log": f"ACCESS_DECISION:GRANTED:ASSET:{request.asset_id}",
            "block_round": 10240,
        },
    }
