"""Transaction-intent boundary for safe API integration.

This module records an authenticated request intent only. It does not sign,
submit, replace, confirm, or authorize a blockchain transaction. Contract facts
remain canonical and the durable record remains a recoverable workflow store.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from .auth import Principal
from .transactions import TransactionStatus


class TransactionIntentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    operation: str = Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")
    arguments: dict[str, str] = Field(default_factory=dict, max_length=32)


@dataclass(frozen=True)
class TransactionIntentResult:
    intent_id: str
    status: TransactionStatus
    chain_id: int
    contract_address: str
    idempotency_key: str
    request_fingerprint: str
    created_at: datetime
    updated_at: datetime


class TransactionIntentWriterUnavailable(RuntimeError):
    """Raised when no approved durable transaction-intent writer is wired."""


class TransactionIntentWriter(Protocol):
    def create_or_get(
        self,
        *,
        principal: Principal,
        idempotency_key: str,
        request: TransactionIntentRequest,
        chain_id: int,
        contract_address: str,
    ) -> TransactionIntentResult:
        """Create or retrieve an identical intent without performing a write on-chain."""


class UnconfiguredTransactionIntentWriter:
    def create_or_get(
        self,
        *,
        principal: Principal,
        idempotency_key: str,
        request: TransactionIntentRequest,
        chain_id: int,
        contract_address: str,
    ) -> TransactionIntentResult:
        del principal, idempotency_key, request, chain_id, contract_address
        raise TransactionIntentWriterUnavailable("durable transaction-intent writer is not configured")


def canonical_request_fingerprint(request: TransactionIntentRequest) -> str:
    payload = json.dumps(request.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    return sha256(payload.encode("utf-8")).hexdigest()


class SQLAlchemyTransactionIntentWriter:
    """Durable adapter for intent creation; signing and chain submission stay outside."""

    def __init__(self, session_factory: Callable[[], object], repository_create: Callable[..., object]) -> None:
        self._session_factory = session_factory
        self._repository_create = repository_create

    def create_or_get(
        self,
        *,
        principal: Principal,
        idempotency_key: str,
        request: TransactionIntentRequest,
        chain_id: int,
        contract_address: str,
    ) -> TransactionIntentResult:
        if not principal.subject:
            raise ValueError("authenticated subject is required")
        if not 8 <= len(idempotency_key) <= 128 or any(ord(char) < 32 for char in idempotency_key):
            raise ValueError("idempotency key length or characters are invalid")
        fingerprint = canonical_request_fingerprint(request)
        now = datetime.now(timezone.utc)
        session = self._session_factory()
        try:
            with session.begin():
                record = self._repository_create(
                    session,
                    intent_id=sha256(f"{principal.subject}:{idempotency_key}".encode("utf-8")).hexdigest(),
                    subject_key=principal.subject,
                    idempotency_key=idempotency_key,
                    request_fingerprint=fingerprint,
                    now=now,
                )
            return TransactionIntentResult(
                intent_id=record.id,
                status=TransactionStatus(record.status),
                chain_id=chain_id,
                contract_address=contract_address,
                idempotency_key=record.idempotency_key,
                request_fingerprint=record.request_fingerprint,
                created_at=record.created_at,
                updated_at=record.updated_at,
            )
        finally:
            session.close()
