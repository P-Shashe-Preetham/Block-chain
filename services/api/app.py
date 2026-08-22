"""Fail-closed API boundary for the platform MVP.

This module deliberately exposes only health/readiness and a protected audit
placeholder until the canonical event indexer and database projection exist.
It is not a production asset API.
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .auth import Principal, require_principal
from .config import Settings


def load_settings() -> Settings:
    return Settings.from_env()


settings = load_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup must fail closed for invalid configuration. Future database/RPC
    # clients belong here, with explicit connectivity and chain-identity checks.
    yield


app = FastAPI(
    title="Blockchain Secure Platform API",
    version="0.1.0-mvp",
    description="Fail-closed API boundary for the contract MVP; full services are staged work.",
    docs_url="/docs" if settings.app_env in {"local", "ci", "development"} else None,
    redoc_url="/redoc" if settings.app_env in {"local", "ci", "development"} else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
)


@app.middleware("http")
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


@app.get("/healthz", tags=["system"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "api", "mode": settings.app_env}


@app.get("/readyz", tags=["system"])
def readyz() -> dict[str, str]:
    if not settings.contract_address:
        return JSONResponse(status_code=503, content={"status": "not_ready", "reason": "contract not configured"})
    return {"status": "ready"}


def principal_dependency(authorization: str | None = Header(default=None)) -> Principal:
    return require_principal(settings, authorization)


@app.get("/v1/audit", tags=["audit"])
def audit_placeholder(principal: Principal = Depends(principal_dependency)):
    del principal
    return JSONResponse(
        status_code=501,
        content={"detail": "canonical event indexer and audit projection are not implemented in the MVP"},
    )
