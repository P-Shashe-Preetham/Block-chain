"""SQLAlchemy adapter for the API's sanitized, read-only audit boundary."""

from __future__ import annotations

from collections.abc import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.audit import AuditEvent, AuditReaderUnavailable, ProjectionStatus
from .models import CanonicalEventRecord


class SQLAlchemyAuditReader:
    """Read canonical projection rows without exposing raw or sensitive fields."""

    def __init__(
        self,
        session_factory: Callable[[], Session],
        *,
        chain_id: int,
        contract_address: str,
    ) -> None:
        if chain_id <= 0:
            raise ValueError("chain_id must be positive")
        if len(contract_address) != 42 or not contract_address.startswith("0x"):
            raise ValueError("contract_address must be a 20-byte 0x-prefixed address")
        self._session_factory = session_factory
        self._chain_id = chain_id
        self._contract_address = contract_address.lower()

    def list_events(
        self,
        *,
        limit: int,
        projection_status: ProjectionStatus | None,
    ) -> tuple[AuditEvent, ...]:
        if limit < 1 or limit > 100:
            raise ValueError("limit must be between 1 and 100")
        statement = (
            select(CanonicalEventRecord)
            .where(
                CanonicalEventRecord.chain_id == self._chain_id,
                CanonicalEventRecord.contract_address == self._contract_address,
            )
            .order_by(
                CanonicalEventRecord.block_number,
                CanonicalEventRecord.log_index,
                CanonicalEventRecord.id,
            )
            .limit(limit)
        )
        if projection_status is not None:
            statement = statement.where(CanonicalEventRecord.projection_status == projection_status.value)
        with self._session_factory() as session:
            rows = session.scalars(statement).all()
        events: list[AuditEvent] = []
        for row in rows:
            try:
                status = ProjectionStatus(row.projection_status)
            except ValueError as exc:
                raise AuditReaderUnavailable("projection contains an unknown status") from exc
            events.append(
                AuditEvent(
                    event_id=row.id,
                    chain_id=row.chain_id,
                    contract_address=row.contract_address,
                    transaction_hash=row.transaction_hash,
                    log_index=row.log_index,
                    block_number=row.block_number,
                    event_name=row.event_name,
                    projection_status=status,
                )
            )
        return tuple(events)
