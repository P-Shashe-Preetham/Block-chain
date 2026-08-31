"""Canonical transaction-intent state machine for the API boundary.

The store is an in-memory reference implementation for local tests only. A
non-local service must replace it with a durable, unique database record keyed
by tenant, authenticated subject, and idempotency key before accepting writes.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import StrEnum


class TransactionStatus(StrEnum):
    REQUESTED = "requested"
    SIGNED = "signed"
    SUBMITTED = "submitted"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    REVERTED = "reverted"
    REPLACED = "replaced"
    UNKNOWN = "unknown"


TERMINAL_STATUSES = frozenset(
    {
        TransactionStatus.CONFIRMED,
        TransactionStatus.FAILED,
        TransactionStatus.REVERTED,
        TransactionStatus.REPLACED,
    }
)

ALLOWED_TRANSITIONS: dict[TransactionStatus, frozenset[TransactionStatus]] = {
    TransactionStatus.REQUESTED: frozenset(
        {TransactionStatus.SIGNED, TransactionStatus.FAILED, TransactionStatus.UNKNOWN}
    ),
    TransactionStatus.SIGNED: frozenset(
        {TransactionStatus.SUBMITTED, TransactionStatus.FAILED, TransactionStatus.UNKNOWN}
    ),
    TransactionStatus.SUBMITTED: frozenset(
        {
            TransactionStatus.PENDING,
            TransactionStatus.FAILED,
            TransactionStatus.REPLACED,
            TransactionStatus.UNKNOWN,
        }
    ),
    TransactionStatus.PENDING: frozenset(
        {
            TransactionStatus.CONFIRMED,
            TransactionStatus.FAILED,
            TransactionStatus.REVERTED,
            TransactionStatus.REPLACED,
            TransactionStatus.UNKNOWN,
        }
    ),
    TransactionStatus.UNKNOWN: frozenset(
        {
            TransactionStatus.PENDING,
            TransactionStatus.CONFIRMED,
            TransactionStatus.FAILED,
            TransactionStatus.REPLACED,
        }
    ),
    TransactionStatus.CONFIRMED: frozenset(),
    TransactionStatus.FAILED: frozenset(),
    TransactionStatus.REVERTED: frozenset(),
    TransactionStatus.REPLACED: frozenset(),
}


class TransactionConflict(ValueError):
    """Raised when an idempotency key is reused for a different request."""


class InvalidTransactionTransition(ValueError):
    """Raised when a transaction attempts an impossible state transition."""


@dataclass(frozen=True)
class TransactionRecord:
    idempotency_key: str
    request_hash: str
    chain_id: int
    contract_address: str
    status: TransactionStatus = TransactionStatus.REQUESTED
    tx_hash: str | None = None


class InMemoryTransactionStore:
    """Deterministic local reference store; not suitable for multi-instance use."""

    def __init__(self) -> None:
        self._records: dict[str, TransactionRecord] = {}

    def create(
        self,
        *,
        idempotency_key: str,
        request_hash: str,
        chain_id: int,
        contract_address: str,
    ) -> TransactionRecord:
        if not 8 <= len(idempotency_key) <= 128:
            raise ValueError("idempotency key length must be between 8 and 128 characters")
        if not request_hash or not contract_address:
            raise ValueError("request hash and contract address are required")
        existing = self._records.get(idempotency_key)
        if existing:
            if existing.request_hash != request_hash:
                raise TransactionConflict("idempotency key was already used for another request")
            return existing
        record = TransactionRecord(
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            chain_id=chain_id,
            contract_address=contract_address,
        )
        self._records[idempotency_key] = record
        return record

    def get(self, idempotency_key: str) -> TransactionRecord | None:
        return self._records.get(idempotency_key)

    def transition(
        self,
        idempotency_key: str,
        next_status: TransactionStatus,
        *,
        tx_hash: str | None = None,
    ) -> TransactionRecord:
        current = self._records.get(idempotency_key)
        if current is None:
            raise KeyError(idempotency_key)
        if next_status not in ALLOWED_TRANSITIONS[current.status]:
            raise InvalidTransactionTransition(f"{current.status} -> {next_status} is not allowed")
        if next_status in {TransactionStatus.SUBMITTED, TransactionStatus.PENDING, TransactionStatus.CONFIRMED} and not (
            tx_hash or current.tx_hash
        ):
            raise ValueError("a transaction hash is required once submission begins")
        updated = replace(current, status=next_status, tx_hash=tx_hash or current.tx_hash)
        self._records[idempotency_key] = updated
        return updated

    def is_terminal(self, idempotency_key: str) -> bool:
        record = self._records.get(idempotency_key)
        return bool(record and record.status in TERMINAL_STATUSES)
