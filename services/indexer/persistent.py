"""SQLAlchemy-backed projection sink for the read-only indexer reference.

This adapter persists derived records only. It never makes authorization
 decisions, signs transactions, or replaces canonical contract reads. Callers
must supply an explicit SQLAlchemy transaction and an already decoded event.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from services.persistence.repository import (
    PersistenceConflict,
    insert_canonical_event,
    insert_raw_chain_log,
    mark_events_uncertain_from,
    record_block_checkpoint,
    remove_checkpoints_from,
    restore_replayed_event,
    finalize_events_through,
)

from .consumer import RawChainLog
from .projector import CanonicalEvent


class PersistentProjection:
    """Small transaction-scoped sink for checkpoints and canonical event records."""

    def __init__(self, session: Session, *, chain_id: int, contract_address: str, confirmations: int) -> None:
        if chain_id < 1 or confirmations < 0 or not isinstance(contract_address, str):
            raise ValueError("projection scope is invalid")
        self._session = session
        self._chain_id = chain_id
        self._contract_address = contract_address.lower()
        self._confirmations = confirmations

    def checkpoint(self, block_number: int, block_hash: str, *, head_block: int) -> None:
        self._validate_head(head_block)
        finalized_through = head_block - self._confirmations
        record_block_checkpoint(
            self._session,
            chain_id=self._chain_id,
            block_number=block_number,
            block_hash=block_hash,
            finalized=block_number <= finalized_through,
        )
        if finalized_through >= 0:
            finalize_events_through(
                self._session,
                chain_id=self._chain_id,
                contract_address=self._contract_address,
                finalized_through=finalized_through,
            )

    def ingest(self, event: CanonicalEvent, *, raw_log: RawChainLog, head_block: int):
        self._validate_head(head_block)
        if event.key.chain_id != self._chain_id or event.key.contract_address.lower() != self._contract_address:
            raise PersistenceConflict("event is outside the projection scope")
        if not isinstance(raw_log, RawChainLog):
            raise ValueError("raw_log is required for persistent projection")
        insert_raw_chain_log(self._session, event, raw_log)
        finalized = head_block - event.block_number >= self._confirmations
        return insert_canonical_event(
            self._session,
            event,
            projection_status="canonical" if finalized else "unfinalized",
        )

    def rollback_from(self, block_number: int) -> int:
        affected = mark_events_uncertain_from(
            self._session,
            chain_id=self._chain_id,
            contract_address=self._contract_address,
            block_number=block_number,
        )
        remove_checkpoints_from(self._session, chain_id=self._chain_id, block_number=block_number)
        return affected

    def restore_replayed(self, event: CanonicalEvent):
        if event.key.chain_id != self._chain_id or event.key.contract_address.lower() != self._contract_address:
            raise PersistenceConflict("replayed event is outside the projection scope")
        return restore_replayed_event(self._session, event)

    def _validate_head(self, head_block: int) -> None:
        if head_block < 0:
            raise ValueError("head block must be non-negative")
