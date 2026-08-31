"""
Standalone Open Banking FastAPI Application.
Wires hardened modular routers (Identity, Organization, Consent, Access, Bank, Audit).
"""

from __future__ import annotations

import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.api.database.connection import db
from services.api.jwt_service import jwt_service

# Include hardened sub-routers
from services.api.identity_routes import router as identity_router
from services.api.organization_routes import router as organization_router
from services.api.consent_routes import router as consent_router
from services.api.access_routes import router as access_router
from services.api.bank_routes import router as bank_router
from services.api.audit_routes import router as audit_router

app = FastAPI(
    title="Open Banking Blockchain Identity & Access Control API",
    version="1.0.0",
    description="Blockchain-based Open Banking Identity Management, Consent, Access Control, and Banking APIs",
)

allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["System"])
def healthz():
    return {"status": "ok", "service": "open-banking-api"}


class ValidateTokenRequest(BaseModel):
    token: str
    expected_audience: Optional[str] = None


@app.post("/api/access/validate-token", tags=["Access & JWT"])
def validate_token(req: ValidateTokenRequest):
    valid, payload, message = jwt_service.verify_token(req.token, req.expected_audience)
    return {"valid": valid, "message": message, "payload": payload}


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
        "registered_users": user_count,
    }


# Include modular routers
app.include_router(identity_router)
app.include_router(organization_router)
app.include_router(consent_router)
app.include_router(access_router)
app.include_router(bank_router)
app.include_router(audit_router)