"""Fail-closed API boundary for the platform final-project work with Open Banking ecosystem services.
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

try:
    from .algorand_routes import router as algorand_router
    ALGORAND_AVAILABLE = True
except Exception:
    ALGORAND_AVAILABLE = False

from .transactions import TransactionConflict
from .config import Settings
from .rpc import verify_rpc_contract

# Open Banking API Routers
from services.api.identity_routes import router as identity_router
from services.api.organization_routes import router as organization_router
from services.api.consent_routes import router as consent_router
from services.api.access_routes import router as access_router
from services.api.bank_routes import router as bank_router
from services.api.audit_routes import router as audit_router


def load_settings() -> Settings:
    return Settings.from_env()


def _default_persistence_adapters(
    settings: Settings,
) -> tuple[AuditReader, TransactionIntentWriter]:
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

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        yield

    api = FastAPI(
        title="Blockchain Open Banking Identity & Access Control API",
        version="1.0.0",
        description="Blockchain-based identity verification, consent management, access control, and simulated banking APIs.",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    import os
    allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173")
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

    api.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    if ALGORAND_AVAILABLE:
        api.include_router(algorand_router)

    api.include_router(identity_router)
    api.include_router(organization_router)
    api.include_router(consent_router)
    api.include_router(access_router)
    api.include_router(bank_router)
    api.include_router(audit_router)

    @api.get("/healthz", tags=["system"])
    def healthz() -> dict[str, str]:
        return {"status": "ok", "service": "open-banking-api", "mode": selected_settings.app_env}

    @api.get("/readyz", tags=["system"])
    def readyz() -> dict[str, str]:
        return {"status": "ready"}

    return api


app = create_app()
