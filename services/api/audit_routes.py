"""
Audit Logging API Routes (Phase 7)
Exposes audit records logged by Access Control and Bank APIs.
"""

from fastapi import APIRouter, Depends
from services.api.database.connection import db
from services.api.auth import require_role

router = APIRouter()

@router.get("/api/audit/logs")
def get_audit_logs(current_user: dict = Depends(require_role("ADMIN", "MANAGER", "AUDITOR", "USER", "ENTERPRISE"))):
    logs = [log.model_dump() for log in db.audit_logs]
    return {"audit_logs": logs, "logs": logs}

@router.get("/api/audit/incidents")
def get_incidents(current_user: dict = Depends(require_role("ADMIN", "MANAGER", "AUDITOR", "USER", "ENTERPRISE"))):
    incidents = [log.model_dump() for log in db.incident_logs]
    return {"incidents": incidents}
