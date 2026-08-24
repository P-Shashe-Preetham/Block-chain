"""Fail-closed API boundary for the platform final-project work.

This module exposes health/readiness and an injected, sanitized read-only audit
projection route. It is not yet the complete transaction, identity, asset,
storage, or production authorization API.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable
from contextlib import asynccontextmanager

from fastapi import Body, Depends, FastAPI, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .audit import AuditReader, AuditReaderUnavailable, ProjectionStatus, UnconfiguredAuditReader
from .auth import Principal, require_principal
from .intents import (
    SQLAlchemyTransactionIntentWriter,
    TransactionIntentRequest,
    TransactionIntentWriter,
    TransactionIntentWriterUnavailable,
    UnconfiguredTransactionIntentWriter,
)
from .algorand_routes import router as algorand_router
from .transactions import TransactionConflict
from .config import Settings
from .rpc import verify_rpc_contract


def load_settings() -> Settings:
    return Settings.from_env()


def _default_persistence_adapters(
    settings: Settings,
) -> tuple[AuditReader, TransactionIntentWriter]:
    """Build lazy durable adapters only for an explicit database and contract.

    This intentionally does not connect at application construction time, authenticate
    callers, submit transactions, or make the projection canonical. Without both
    settings, routes retain their unconfigured fail-closed behavior.
    """
    if not settings.database_url or not settings.contract_address:
        return UnconfiguredAuditReader(), UnconfiguredTransactionIntentWriter()

    from services.persistence.audit_reader import SQLAlchemyAuditReader
    from services.persistence.database import DatabaseSettings, create_session_factory
    from services.persistence.repository import create_or_get_transaction_intent

    session_factory = create_session_factory(
        DatabaseSettings(
            app_env=settings.app_env,
            database_url=settings.database_url,
            database_ssl_mode=settings.database_ssl_mode,
        )
    )
    return (
        SQLAlchemyAuditReader(
            session_factory,
            chain_id=settings.chain_id,
            contract_address=settings.contract_address,
        ),
        SQLAlchemyTransactionIntentWriter(session_factory, create_or_get_transaction_intent),
    )


def create_app(
    app_settings: Settings | None = None,
    *,
    audit_reader: AuditReader | None = None,
    transaction_intent_writer: TransactionIntentWriter | None = None,
    principal_provider: Callable[[str | None], Principal] | None = None,
) -> FastAPI:
    """Build an app with explicit settings and injected non-authoritative readers."""
    selected_settings = app_settings or load_settings()
    default_audit_reader, default_transaction_writer = _default_persistence_adapters(selected_settings)
    selected_audit_reader = audit_reader or default_audit_reader
    selected_transaction_writer = transaction_intent_writer or default_transaction_writer

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

    api.include_router(algorand_router)

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

    @api.post("/v1/transaction-intents", tags=["transactions"])
    def create_transaction_intent(
        request: TransactionIntentRequest = Body(...),
        idempotency_key: str = Header(..., alias="Idempotency-Key"),
        principal: Principal = Depends(principal_dependency),
    ) -> dict[str, object]:
        if not selected_settings.contract_address:
            return JSONResponse(status_code=503, content={"detail": "contract is not configured"})
        try:
            result = selected_transaction_writer.create_or_get(
                principal=principal,
                idempotency_key=idempotency_key,
                request=request,
                chain_id=selected_settings.chain_id,
                contract_address=selected_settings.contract_address,
            )
        except TransactionIntentWriterUnavailable:
            return JSONResponse(status_code=503, content={"detail": "transaction intent service is not available"})
        except TransactionConflict as exc:
            return JSONResponse(status_code=409, content={"detail": str(exc)})
        except ValueError:
            return JSONResponse(status_code=422, content={"detail": "transaction intent is invalid"})
        return {
            "intent_id": result.intent_id,
            "status": result.status.value,
            "chain_id": result.chain_id,
            "contract_address": result.contract_address,
            "idempotency_key": result.idempotency_key,
            "request_fingerprint": result.request_fingerprint,
            "created_at": result.created_at.isoformat(),
            "updated_at": result.updated_at.isoformat(),
            "on_chain_submission": False,
        }

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
