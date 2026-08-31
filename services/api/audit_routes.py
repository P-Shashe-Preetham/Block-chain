"""
Audit Logging API Routes (Phase 7)
Exposes audit records logged by Access Control and Bank APIs.
"""

from fastapi import APIRouter
from services.api.database.connection import db

router = APIRouter()

@router.get("/api/audit/logs")
def get_audit_logs():
    return {"audit_logs": [log.model_dump() for log in db.audit_logs]}
