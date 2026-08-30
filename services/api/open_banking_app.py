"""
Standalone Open Banking FastAPI Application (Phases 1 - 7)
"""

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from services.api.blockchain_service import blockchain_service
from services.api.jwt_service import jwt_service
from services.api.database.connection import db

app = FastAPI(
    title="Open Banking Blockchain Identity & Access Control API",
    version="1.0.0",
    description="Blockchain-based Open Banking Identity Management, Consent, Access Control, and Banking APIs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Models -----------------
class RegisterOrgRequest(BaseModel):
    name: str
    role: str
    license_id: str
    wallet_address: str

class UpdateOrgStatusRequest(BaseModel):
    wallet_address: str

class RegisterIdentityRequest(BaseModel):
    did: str
    pii_data: str
    wallet_address: str

class VerifyIdentityRequest(BaseModel):
    wallet_address: str

class GrantConsentRequest(BaseModel):
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str
    duration_seconds: int = 3600

class RevokeConsentRequest(BaseModel):
    consent_id: str
    user_wallet: str

class RequestAccessRequest(BaseModel):
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str

class ValidateTokenRequest(BaseModel):
    token: str

# ----------------- System Routes -----------------
@app.get("/healthz", tags=["System"])
def healthz():
    return {"status": "ok", "service": "open-banking-api"}

# ----------------- Phase 1: Organizations -----------------
@app.post("/api/organizations/register", tags=["Organizations"])
def register_organization(req: RegisterOrgRequest):
    if req.role not in ["BANK", "TSP", "REGULATOR"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be BANK, TSP, or REGULATOR.")
    org = blockchain_service.register_organization(req.name, req.role, req.license_id, req.wallet_address)
    return {"success": True, "organization": org}

@app.post("/api/organizations/approve", tags=["Organizations"])
def approve_organization(req: UpdateOrgStatusRequest):
    success = blockchain_service.approve_organization(req.wallet_address)
    if not success:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"success": True, "message": f"Organization {req.wallet_address} approved by Regulator."}

@app.get("/api/organizations/list", tags=["Organizations"])
def list_organizations():
    org_list = []
    for org in db.organizations.values():
        org_dict = org if isinstance(org, dict) else org.model_dump()
        org_list.append(org_dict)
    return {"organizations": org_list}

# ----------------- Phase 2: Identity -----------------
@app.post("/api/identity/register", tags=["Identity"])
def register_identity(req: RegisterIdentityRequest):
    record = blockchain_service.register_identity(req.did, req.pii_data, req.wallet_address)
    return {"success": True, "data": record}

@app.post("/api/identity/verify", tags=["Identity"])
def verify_identity(req: VerifyIdentityRequest):
    success = blockchain_service.verify_identity(req.wallet_address)
    if not success:
        raise HTTPException(status_code=404, detail="User wallet not found")
    return {"success": True, "message": f"Wallet {req.wallet_address} verified successfully and set to ACTIVE."}

@app.get("/api/identity/status/{wallet_address}", tags=["Identity"])
def get_identity_status(wallet_address: str):
    user = db.users.get(wallet_address)
    if not user:
        return {"registered": False, "status": "NONE"}
    status = user.get("status") if isinstance(user, dict) else getattr(user, "status", "UNKNOWN")
    did = user.get("did") if isinstance(user, dict) else getattr(user, "did", "")
    return {"registered": True, "status": status, "did": did, "wallet_address": wallet_address}

# ----------------- Phase 3: Consent -----------------
@app.post("/api/consent/grant", tags=["Consent"])
def grant_consent(req: GrantConsentRequest):
    consent = blockchain_service.grant_consent(
        req.user_wallet, req.bank_wallet, req.tsp_wallet, req.data_type, req.duration_seconds
    )
    return {"success": True, "consent": consent.model_dump()}

@app.post("/api/consent/revoke", tags=["Consent"])
def revoke_consent(req: RevokeConsentRequest):
    success = blockchain_service.revoke_consent(req.consent_id, req.user_wallet)
    if not success:
        raise HTTPException(status_code=400, detail="Consent not found or caller unauthorized.")
    return {"success": True, "message": f"Consent {req.consent_id} revoked successfully."}

@app.get("/api/consent/user/{user_wallet}", tags=["Consent"])
def get_user_consents(user_wallet: str):
    user_consents = []
    for c in db.consents.values():
        if c.user_wallet.lower() == user_wallet.lower():
            user_consents.append(c.model_dump())
    return {"consents": user_consents}

@app.get("/api/consent/list", tags=["Consent"])
def list_all_consents():
    return {"consents": [c.model_dump() for c in db.consents.values()]}

# ----------------- Phase 4 & 6: Access & JWT -----------------
@app.post("/api/access/evaluate", tags=["Access & JWT"])
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

@app.post("/api/access/validate-token", tags=["Access & JWT"])
def validate_token(req: ValidateTokenRequest):
    valid, payload, message = jwt_service.verify_token(req.token)
    return {
        "valid": valid,
        "message": message,
        "payload": payload
    }

# ----------------- Phase 5: Banks -----------------
def _verify_authorization(authorization: Optional[str], requested_bank_id: str, requested_data_type: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header. Bearer token required.")

    token = authorization.split(" ")[1]
    valid, payload, message = jwt_service.verify_token(token)

    if not valid or not payload:
        raise HTTPException(status_code=401, detail=f"JWT Authorization Failed: {message}")

    user_wallet = payload["sub"]
    bank_wallet = payload["bank_wallet"]
    tsp_wallet = payload["tsp_wallet"]
    data_type = payload["data_type"]

    has_live_consent = blockchain_service.check_consent(user_wallet, bank_wallet, tsp_wallet, data_type)
    if not has_live_consent:
        blockchain_service.log_audit_event(
            user_wallet, bank_wallet, tsp_wallet, data_type, False, "Revoked or expired consent during bank API call"
        )
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Consent was revoked or expired on the blockchain since token issuance."
        )

    return payload

@app.get("/api/banks/bank-a/accounts", tags=["Simulated Banks"])
def get_bank_a_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_A", "ACCOUNT_INFO")
    user_wallet = payload["sub"]
    accounts = [acc.model_dump() for acc in db.accounts.values() if acc.bank_id == "BANK_A" and acc.user_wallet.lower() == user_wallet.lower()]
    return {"bank": "Bank A (Apex Financial)", "user_wallet": user_wallet, "accounts": accounts}

@app.get("/api/banks/bank-a/transactions/{account_id}", tags=["Simulated Banks"])
def get_bank_a_transactions(account_id: str, authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_A", "TRANSACTIONS")
    txs = db.transactions.get(account_id, [])
    return {"bank": "Bank A (Apex Financial)", "account_id": account_id, "transactions": [tx.model_dump() for tx in txs]}

@app.get("/api/banks/bank-b/accounts", tags=["Simulated Banks"])
def get_bank_b_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_B", "ACCOUNT_INFO")
    user_wallet = payload["sub"]
    accounts = [acc.model_dump() for acc in db.accounts.values() if acc.bank_id == "BANK_B" and acc.user_wallet.lower() == user_wallet.lower()]
    return {"bank": "Bank B (Beacon Trust)", "user_wallet": user_wallet, "accounts": accounts}

@app.get("/api/banks/bank-c/accounts", tags=["Simulated Banks"])
def get_bank_c_accounts(authorization: Optional[str] = Header(None)):
    payload = _verify_authorization(authorization, "BANK_C", "ACCOUNT_INFO")
    user_wallet = payload["sub"]
    accounts = [acc.model_dump() for acc in db.accounts.values() if acc.bank_id == "BANK_C" and acc.user_wallet.lower() == user_wallet.lower()]
    return {"bank": "Bank C (Crest Capital)", "user_wallet": user_wallet, "accounts": accounts}

# ----------------- Phase 7: Audit Logs & Stats -----------------
@app.get("/api/audit/logs", tags=["Audit"])
def get_audit_logs(
    user_wallet: Optional[str] = Query(None),
    bank_wallet: Optional[str] = Query(None),
    tsp_wallet: Optional[str] = Query(None),
    granted: Optional[bool] = Query(None)
):
    logs = [log.model_dump() for log in db.audit_logs]
    if user_wallet:
        logs = [l for l in logs if l["user_wallet"].lower() == user_wallet.lower()]
    if bank_wallet:
        logs = [l for l in logs if l["bank_wallet"].lower() == bank_wallet.lower()]
    if tsp_wallet:
        logs = [l for l in logs if l["tsp_wallet"].lower() == tsp_wallet.lower()]
    if granted is not None:
        logs = [l for l in logs if l["granted"] == granted]

    return {"audit_logs": logs}

@app.get("/api/audit/stats", tags=["Audit"])
def get_audit_stats():
    total_logs = len(db.audit_logs)
    granted_count = sum(1 for l in db.audit_logs if l.granted)
    denied_count = total_logs - granted_count
    active_consents_count = sum(1 for c in db.consents.values() if c.active)
    org_count = len(db.organizations)
    user_count = len(db.users)

    return {
        "total_audit_logs": total_logs,
        "granted_requests": granted_count,
        "denied_requests": denied_count,
        "active_consents": active_consents_count,
        "registered_organizations": org_count,
        "registered_users": user_count
    }
