"""Small durable repository boundary for the staged persistence models.

Callers must wrap operations in an explicit SQLAlchemy transaction. This
adapter does not expose API routes, perform authorization, or repair canonical
state; it only persists validated workflow/projection records.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from services.api.transactions import (
    ALLOWED_TRANSITIONS,
    InvalidTransactionTransition,
    TransactionConflict,
    TransactionStatus,
)
from services.indexer.consumer import RawChainLog
from services.indexer.projector import CanonicalEvent, EventKey
from services.indexer.reconcile import Drift
from .models import BlockCheckpoint, CanonicalEventRecord, RawChainLogRecord, ReconciliationFinding, TransactionIntent


class PersistenceConflict(ValueError):
    """Raised when a canonical event identity is reused with different content."""


def create_or_get_transaction_intent(
    session: Session,
    *,
    intent_id: str,
    subject_key: str,
    idempotency_key: str,
    request_fingerprint: str,
    status: str = "requested",
    transaction_hash: str | None = None,
    now: datetime | None = None,
) -> TransactionIntent:
    """Return an identical intent or reject conflicting idempotency reuse."""
    _require_text(intent_id, "intent_id", 64)
    _require_text(subject_key, "subject_key", 128)
    _require_text(idempotency_key, "idempotency_key", 128)
    _require_text(request_fingerprint, "request_fingerprint", 64)
    _require_text(status, "status", 32)
    if transaction_hash is not None:
        _require_text(transaction_hash, "transaction_hash", 66)
    existing = session.scalar(
        select(TransactionIntent).where(
            TransactionIntent.subject_key == subject_key,
            TransactionIntent.idempotency_key == idempotency_key,
        )
    )
    if existing:
        if existing.request_fingerprint != request_fingerprint:
            raise TransactionConflict("idempotency key was already used for another request")
        return existing
    timestamp = now or datetime.now(timezone.utc)
    try:
        selected_status = TransactionStatus(status)
    except ValueError as exc:
        raise ValueError("transaction status is invalid") from exc
    if selected_status in {TransactionStatus.SUBMITTED, TransactionStatus.PENDING, TransactionStatus.CONFIRMED} and not transaction_hash:
        raise ValueError("a transaction hash is required once submission begins")
    intent = TransactionIntent(
        id=intent_id,
        subject_key=subject_key,
        idempotency_key=idempotency_key,
        request_fingerprint=request_fingerprint,
        status=selected_status.value,
        transaction_hash=transaction_hash,
        created_at=timestamp,
        updated_at=timestamp,
    )
    session.add(intent)
    session.flush()
    return intent


def transition_transaction_intent(
    session: Session,
    *,
    subject_key: str,
    idempotency_key: str,
    next_status: TransactionStatus | str,
    transaction_hash: str | None = None,
    now: datetime | None = None,
) -> TransactionIntent:
    """Apply one legal durable state transition within the caller's transaction."""
    _require_text(subject_key, "subject_key", 128)
    _require_text(idempotency_key, "idempotency_key", 128)
    existing = session.scalar(
        select(TransactionIntent).where(
            TransactionIntent.subject_key == subject_key,
            TransactionIntent.idempotency_key == idempotency_key,
        )
    )
    if existing is None:
        raise KeyError(idempotency_key)
    try:
        current_status = TransactionStatus(existing.status)
        selected_status = TransactionStatus(next_status)
    except ValueError as exc:
        raise ValueError("transaction status is invalid") from exc
    if selected_status not in ALLOWED_TRANSITIONS[current_status]:
        raise InvalidTransactionTransition(f"{current_status} -> {selected_status} is not allowed")
    if transaction_hash is not None:
        _require_transaction_hash(transaction_hash)
    if selected_status in {TransactionStatus.SUBMITTED, TransactionStatus.PENDING, TransactionStatus.CONFIRMED} and not (
        transaction_hash or existing.transaction_hash
    ):
        raise ValueError("a transaction hash is required once submission begins")
    existing.status = selected_status.value
    if transaction_hash:
        existing.transaction_hash = transaction_hash
    existing.updated_at = now or datetime.now(timezone.utc)
    session.flush()
    return existing


def insert_reconciliation_finding(
    session: Session,
    finding: Drift,
    *,
    observed_at: datetime | None = None,
) -> ReconciliationFinding:
    """Persist deterministic drift evidence without changing canonical or projected facts."""
    if not isinstance(finding, Drift):
        raise ValueError("finding must be a Drift")
    _require_text(finding.key, "subject_key", 256)
    canonical_value = finding.canonical_value
    projected_value = finding.projected_value
    for value, name in ((canonical_value, "canonical_value"), (projected_value, "projected_value")):
        if value is not None:
            _require_text(value, name, 65535)
    finding_id = hashlib.sha256(
        json.dumps(
            [finding.key, finding.kind, canonical_value, projected_value],
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    existing = session.get(ReconciliationFinding, finding_id)
    if existing:
        if any((
            existing.subject_key != finding.key,
            existing.finding_kind != finding.kind,
            existing.canonical_value != canonical_value,
            existing.projected_value != projected_value,
        )):
            raise PersistenceConflict("reconciliation finding identity was reused for different content")
        return existing
    record = ReconciliationFinding(
        id=finding_id,
        subject_key=finding.key,
        finding_kind=finding.kind,
        canonical_value=canonical_value,
        projected_value=projected_value,
        status="open",
        created_at=observed_at or datetime.now(timezone.utc),
        resolved_at=None,
    )
    session.add(record)
    session.flush()
    return record


def insert_raw_chain_log(
    session: Session,
    event: CanonicalEvent,
    raw_log: RawChainLog,
    *,
    observed_at: datetime | None = None,
) -> RawChainLogRecord:
    """Persist the exact decoded log input once for later integrity review."""
    if not isinstance(event, CanonicalEvent) or not isinstance(raw_log, RawChainLog):
        raise ValueError("event and raw_log are required")
    _validate_event_key(event.key)
    if (
        raw_log.block_number != event.block_number
        or raw_log.block_hash != event.block_hash
        or raw_log.transaction_hash.lower() != event.key.transaction_hash.lower()
        or raw_log.log_index != event.key.log_index
        or raw_log.address.lower() != event.key.contract_address.lower()
    ):
        raise PersistenceConflict("raw log does not match canonical event identity")
    event_id = _event_id(event.key)
    topics_json = json.dumps(list(raw_log.topics), separators=(",", ":"))
    data_hex = raw_log.data.lower()
    existing = session.get(RawChainLogRecord, event_id)
    if existing:
        if any((
            existing.chain_id != event.key.chain_id,
            existing.contract_address != event.key.contract_address.lower(),
            existing.transaction_hash != event.key.transaction_hash.lower(),
            existing.log_index != event.key.log_index,
            existing.block_number != raw_log.block_number,
            existing.block_hash != raw_log.block_hash,
            existing.topics_json != topics_json,
            existing.data_hex != data_hex,
        )):
            raise PersistenceConflict("raw chain-log identity was reused for different content")
        return existing
    record = RawChainLogRecord(
        event_id=event_id,
        chain_id=event.key.chain_id,
        contract_address=event.key.contract_address.lower(),
        transaction_hash=event.key.transaction_hash.lower(),
        log_index=event.key.log_index,
        block_number=raw_log.block_number,
        block_hash=raw_log.block_hash,
        topics_json=topics_json,
        data_hex=data_hex,
        observed_at=observed_at or datetime.now(timezone.utc),
    )
    session.add(record)
    session.flush()
    return record


def insert_canonical_event(
    session: Session,
    event: CanonicalEvent,
    *,
    projection_status: str = "canonical",
    observed_at: datetime | None = None,
) -> CanonicalEventRecord:
    """Persist an event once, rejecting content changes for the same identity."""
    if not isinstance(event, CanonicalEvent):
        raise ValueError("event must be a CanonicalEvent")
    _validate_event_key(event.key)
    if projection_status not in {"canonical", "unfinalized", "uncertain"}:
        raise ValueError("projection_status is invalid")
    event_id = _event_id(event.key)
    existing = session.scalar(select(CanonicalEventRecord).where(CanonicalEventRecord.id == event_id))
    payload_json = json.dumps(dict(event.payload), sort_keys=True, separators=(",", ":"))
    if existing:
        if any((
            existing.block_number != event.block_number,
            existing.block_hash != event.block_hash,
            existing.event_name != event.name,
            existing.payload_json != payload_json,
        )):
            raise PersistenceConflict("canonical event identity was reused for different content")
        return existing
    record = CanonicalEventRecord(
        id=event_id,
        chain_id=event.key.chain_id,
        contract_address=event.key.contract_address,
        transaction_hash=event.key.transaction_hash,
        log_index=event.key.log_index,
        event_version=event.key.event_version,
        block_number=event.block_number,
        block_hash=event.block_hash,
        event_name=event.name,
        payload_json=payload_json,
        projection_status=projection_status,
        observed_at=observed_at or datetime.now(timezone.utc),
    )
    session.add(record)
    session.flush()
    return record


def record_block_checkpoint(
    session: Session,
    *,
    chain_id: int,
    block_number: int,
    block_hash: str,
    finalized: bool,
    observed_at: datetime | None = None,
) -> BlockCheckpoint:
    """Persist one checkpoint idempotently and reject block-hash conflicts."""
    _validate_block_identity(chain_id, block_number, block_hash)
    existing = session.scalar(
        select(BlockCheckpoint).where(
            BlockCheckpoint.chain_id == chain_id,
            BlockCheckpoint.block_number == block_number,
        )
    )
    if existing:
        if existing.block_hash != block_hash:
            raise PersistenceConflict("block number was observed with a different hash")
        if finalized and not existing.finalized:
            existing.finalized = True
            session.flush()
        return existing
    checkpoint = BlockCheckpoint(
        chain_id=chain_id,
        block_number=block_number,
        block_hash=block_hash,
        finalized=finalized,
        observed_at=observed_at or datetime.now(timezone.utc),
    )
    session.add(checkpoint)
    session.flush()
    return checkpoint


def mark_events_uncertain_from(
    session: Session,
    *,
    chain_id: int,
    contract_address: str,
    block_number: int,
) -> int:
    """Withhold affected records after a detected reorg without deleting history."""
    _validate_block_quantity(chain_id, block_number)
    _require_text(contract_address, "contract_address", 42)
    result = session.execute(
        update(CanonicalEventRecord)
        .where(
            CanonicalEventRecord.chain_id == chain_id,
            CanonicalEventRecord.contract_address == contract_address.lower(),
            CanonicalEventRecord.block_number >= block_number,
            CanonicalEventRecord.projection_status.in_(("canonical", "unfinalized")),
        )
        .values(projection_status="uncertain")
    )
    session.flush()
    return result.rowcount or 0


def finalize_events_through(
    session: Session,
    *,
    chain_id: int,
    contract_address: str,
    finalized_through: int,
) -> int:
    """Promote only previously unfinalized events at or below a finality boundary."""
    _validate_block_quantity(chain_id, finalized_through)
    _require_text(contract_address, "contract_address", 42)
    result = session.execute(
        update(CanonicalEventRecord)
        .where(
            CanonicalEventRecord.chain_id == chain_id,
            CanonicalEventRecord.contract_address == contract_address.lower(),
            CanonicalEventRecord.block_number <= finalized_through,
            CanonicalEventRecord.projection_status == "unfinalized",
        )
        .values(projection_status="canonical")
    )
    session.flush()
    return result.rowcount or 0


def remove_checkpoints_from(
    session: Session,
    *,
    chain_id: int,
    block_number: int,
) -> int:
    """Remove only derived checkpoints at or after a reorg boundary."""
    _validate_block_quantity(chain_id, block_number)
    result = session.query(BlockCheckpoint).filter(
        BlockCheckpoint.chain_id == chain_id,
        BlockCheckpoint.block_number >= block_number,
    ).delete(synchronize_session=False)
    session.flush()
    return result


def restore_replayed_event(
    session: Session,
    event: CanonicalEvent,
    *,
    observed_at: datetime | None = None,
) -> CanonicalEventRecord:
    """Validate a replay against the original identity, then make it canonical."""
    record = insert_canonical_event(session, event, projection_status="canonical", observed_at=observed_at)
    if record.projection_status == "uncertain":
        record.projection_status = "canonical"
        session.flush()
    return record


def _validate_block_quantity(chain_id: int, block_number: int) -> None:
    if chain_id < 1 or block_number < 0:
        raise ValueError("chain ID and block number are invalid")


def _require_transaction_hash(value: str) -> None:
    _require_text(value, "transaction_hash", 66)
    if len(value) != 66 or not value.startswith("0x") or any(char not in "0123456789abcdefABCDEF" for char in value[2:]):
        raise ValueError("transaction_hash is invalid")


def _validate_block_identity(chain_id: int, block_number: int, block_hash: str) -> None:
    _validate_block_quantity(chain_id, block_number)
    _require_text(block_hash, "block_hash", 66)


def _event_id(key: EventKey) -> str:
    return f"{key.chain_id}:{key.contract_address.lower()}:{key.transaction_hash.lower()}:{key.log_index}:{key.event_version}"


def _validate_event_key(key: EventKey) -> None:
    if key.chain_id < 1 or key.log_index < 0 or key.event_version < 1:
        raise ValueError("event key quantities must be positive")
    _require_text(key.contract_address, "contract_address", 42)
    _require_text(key.transaction_hash, "transaction_hash", 66)


def _require_text(value: object, name: str, maximum: int) -> None:
    if not isinstance(value, str) or not value or len(value) > maximum or any(ord(char) < 32 for char in value):
        raise ValueError(f"{name} is invalid")
