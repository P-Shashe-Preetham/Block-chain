"""Fail-closed API boundary for the platform final-project work.

This module exposes health/readiness and an injected, sanitized read-only audit
projection route. It is not yet the complete transaction, identity, asset,
storage, or production authorization API.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .audit import AuditReader, AuditReaderUnavailable, ProjectionStatus, UnconfiguredAuditReader
from .auth import Principal, require_principal
from .config import Settings
from .rpc import verify_rpc_contract


def load_settings() -> Settings:
    return Settings.from_env()


def create_app(
    app_settings: Settings | None = None,
    *,
    audit_reader: AuditReader | None = None,
    principal_provider: Callable[[str | None], Principal] | None = None,
) -> FastAPI:
    """Build an app with explicit settings and injected non-authoritative readers."""
    selected_settings = app_settings or load_settings()
    selected_audit_reader = audit_reader or UnconfiguredAuditReader()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        # Startup must fail closed for invalid configuration. Future database/RPC
        # clients belong here, with explicit connectivity and chain-identity checks.
        yield

    api = FastAPI(
        title="Blockchain Secure Platform API",
        version="0.2.0-final-project-foundation",
        description="Fail-closed API foundation with a sanitized projection-only audit route; state-changing services remain gated.",
        docs_url="/docs" if selected_settings.app_env in {"local", "ci", "development"} else None,
        redoc_url="/redoc" if selected_settings.app_env in {"local", "ci", "development"} else None,
        lifespan=lifespan,
    )

    api.add_middleware(
        CORSMiddleware,
        allow_origins=list(selected_settings.cors_allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    )

    @api.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", "").strip() or str(uuid.uuid4())
        if len(request_id) > 128 or any(ord(char) < 32 for char in request_id):
            return JSONResponse(status_code=400, content={"detail": "invalid request id"})
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response

    @api.get("/healthz", tags=["system"])
    def healthz() -> dict[str, str]:
        return {"status": "ok", "service": "api", "mode": selected_settings.app_env}

    @api.get("/readyz", tags=["system"])
    def readyz() -> dict[str, str]:
        if not selected_settings.contract_address:
            return JSONResponse(status_code=503, content={"status": "not_ready", "reason": "contract not configured"})
        if not verify_rpc_contract(selected_settings):
            return JSONResponse(status_code=503, content={"status": "not_ready", "reason": "chain or contract unavailable"})
        return {"status": "ready"}

    def principal_dependency(authorization: str | None = Header(default=None)) -> Principal:
        if principal_provider is not None:
            return principal_provider(authorization)
        return require_principal(selected_settings, authorization)

    @api.get("/v1/audit", tags=["audit"])
    def audit_events(
        limit: int = Query(default=50, ge=1, le=100),
        projection_status: ProjectionStatus | None = Query(default=None),
        principal: Principal = Depends(principal_dependency),
    ) -> dict[str, object]:
        del principal
        try:
            events = selected_audit_reader.list_events(limit=limit, projection_status=projection_status)
        except AuditReaderUnavailable as exc:
            return JSONResponse(
                status_code=503,
                content={"detail": "audit projection is not available"},
            )
        return {
            "projection_only": True,
            "events": [
                {
                    "event_id": event.event_id,
                    "chain_id": event.chain_id,
                    "contract_address": event.contract_address,
                    "transaction_hash": event.transaction_hash,
                    "log_index": event.log_index,
                    "block_number": event.block_number,
                    "event_name": event.event_name,
                    "projection_status": event.projection_status.value,
                }
                for event in events
            ],
        }

    return api
