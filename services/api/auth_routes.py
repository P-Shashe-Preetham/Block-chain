import os
import secrets
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.api.database.connection import db
from services.api.database.models import AuthNonce
from services.api.signature_verifier import verify_personal_signature
from services.api.jwt_service import JWTService
from services.api.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
jwt_service = JWTService()

class NonceRequest(BaseModel):
    wallet_address: str

class LoginRequest(BaseModel):
    wallet_address: str
    signature: str
    nonce: str

@router.get("/nonce")
async def get_nonce(wallet_address: str):
    """Generate a cryptographic nonce for wallet signature challenge."""
    if not wallet_address or not wallet_address.startswith("0x"):
        raise HTTPException(status_code=400, detail="Invalid wallet address")
    
    nonce = secrets.token_hex(32)
    message = f"Sign in to BEL Digital Asset Platform\n\nWallet: {wallet_address}\nNonce: {nonce}\nTimestamp: {int(time.time())}"
    
    auth_nonce = AuthNonce(
        wallet_address=wallet_address.lower(),
        nonce=nonce,
        message=message,
        created_at=time.time(),
        expires_at=time.time() + 300  # 5 minutes
    )
    db.nonces[wallet_address.lower()] = auth_nonce
    
    return {"nonce": nonce, "message": message}

@router.post("/login")
async def login(request: LoginRequest):
    """Verify wallet signature and issue session JWT."""
    wallet = request.wallet_address.lower()
    
    # 1. Check nonce exists and is valid
    stored_nonce = db.nonces.get(wallet)
    if not stored_nonce:
        raise HTTPException(status_code=400, detail="No pending nonce for this wallet. Request a nonce first.")
    
    if time.time() > stored_nonce.expires_at:
        del db.nonces[wallet]
        raise HTTPException(status_code=400, detail="Nonce expired. Request a new one.")
    
    if stored_nonce.nonce != request.nonce:
        raise HTTPException(status_code=400, detail="Invalid nonce")
    
    # 2. Verify the signature
    try:
        is_valid = verify_personal_signature(wallet, stored_nonce.message, request.signature)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Signature verification failed")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Signature verification error: {str(e)}")
    
    # 3. Delete nonce (single-use)
    del db.nonces[wallet]
    
    # 4. Look up user role
    user = db.users.get(wallet)
    if isinstance(user, dict):
        role = user.get("role", "USER")
        user_name = user.get("name", "Unknown")
    elif user is not None:
        role = getattr(user, "role", "USER")
        user_name = getattr(user, "name", "Unknown")
    else:
        role = "USER"
        user_name = "Unknown"
    
    # 5. Issue session JWT
    token = jwt_service.create_session_token(wallet, role)
    
    return {
        "token": token,
        "wallet_address": wallet,
        "role": role,
        "name": user_name
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info."""
    wallet = current_user["wallet"]
    user = db.users.get(wallet)
    if isinstance(user, dict):
        user_name = user.get("name", "Unknown")
        status_val = user.get("status", "UNKNOWN")
        did_val = user.get("did")
    elif user is not None:
        user_name = getattr(user, "name", "Unknown")
        status_val = getattr(user, "status", "UNKNOWN")
        did_val = getattr(user, "did", None)
    else:
        user_name = "Unknown"
        status_val = "UNKNOWN"
        did_val = None

    return {
        "wallet_address": wallet,
        "role": current_user["role"],
        "name": user_name,
        "status": status_val,
        "did": did_val
    }

class MetadataRequest(BaseModel):
    fileContent: str
    serialUUID: str
    timestamp: str

@router.post("/hash-metadata")
async def hash_metadata(req: MetadataRequest, current_user: dict = Depends(get_current_user)):
    """Returns the keccak256 hash of physical asset metadata."""
    try:
        from web3 import Web3
        data_str = req.fileContent + req.serialUUID + req.timestamp
        # Return as bytes32 hex
        return {"metadataHash": Web3.keccak(text=data_str).hex()}
    except ImportError:
        # Fallback to sha256 if web3 is not available
        import hashlib
        data_str = req.fileContent + req.serialUUID + req.timestamp
        return {"metadataHash": "0x" + hashlib.sha256(data_str.encode()).hexdigest()}

@router.post("/logout")
async def logout():
    """Logout (client-side token discard)."""
    return {"message": "Logged out successfully"}
