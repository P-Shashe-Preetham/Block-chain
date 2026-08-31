"""Read-only, sanitized audit projection boundary for the versioned API.

The reader is intentionally injected. The database and indexer are recoverable
projections; this route never authorizes from them and never exposes raw logs,
identity material, keys, or plaintext asset content.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol


class AuditReaderUnavailable(RuntimeError):
    """Raised when no approved durable audit projection is wired."""


class ProjectionStatus(StrEnum):
    CANONICAL = "canonical"
    UNFINALIZED = "unfinalized"
    UNCERTAIN = "uncertain"


@dataclass(frozen=True)
class AuditEvent:
    event_id: str
    chain_id: int
    contract_address: str
    transaction_hash: str
    log_index: int
    block_number: int
    event_name: str
    projection_status: ProjectionStatus


class AuditReader(Protocol):
    def list_events(
        self,
        *,
        limit: int,
        projection_status: ProjectionStatus | None,
    ) -> tuple[AuditEvent, ...]:
        """Return sanitized projection records in deterministic order."""


class UnconfiguredAuditReader:
    """Safe default until a durable, authorized projection adapter is wired."""

    def list_events(
        self,
        *,
        limit: int,
        projection_status: ProjectionStatus | None,
    ) -> tuple[AuditEvent, ...]:
        del limit, projection_status
        raise AuditReaderUnavailable("durable audit projection is not configured")


class MemoryAuditReader:
    """Deterministic fixture reader for route tests and local UI development only."""

    def __init__(self, events: tuple[AuditEvent, ...] = ()) -> None:
        self._events = tuple(sorted(events, key=lambda event: (event.block_number, event.log_index, event.event_id)))

    def list_events(
        self,
        *,
        limit: int,
        projection_status: ProjectionStatus | None,
    ) -> tuple[AuditEvent, ...]:
        selected = (
            event
            for event in self._events
            if projection_status is None or event.projection_status is projection_status
        )
        return tuple(selected)[:limit]
