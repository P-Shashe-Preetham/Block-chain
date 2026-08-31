from __future__ import annotations

import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from services.api.transactions import InvalidTransactionTransition, TransactionConflict, TransactionStatus
from services.indexer.consumer import RawChainLog
from services.indexer.projector import CanonicalEvent, EventKey
from services.indexer.reconcile import find_drift
from services.persistence.models import Base, BlockCheckpoint, CanonicalEventRecord
from services.persistence.repository import (
    PersistenceConflict,
    create_or_get_transaction_intent,
    insert_canonical_event,
    insert_raw_chain_log,
    insert_reconciliation_finding,
    mark_events_uncertain_from,
    remove_checkpoints_from,
    record_block_checkpoint,
    restore_replayed_event,
    transition_transaction_intent,
)


NOW = datetime.now(timezone.utc)


def canonical_event(*, name: str = "AssetRegistered", payload: tuple[tuple[str, str], ...] = ()) -> CanonicalEvent:
    return CanonicalEvent(EventKey(31337, "0x" + "1" * 40, "0x" + "2" * 64, 0), 1, "0x" + "3" * 64, name, payload)


class PersistenceRepositoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)

    def test_intent_retry_returns_existing_and_conflict_fails(self) -> None:
        with Session(self.engine) as session:
            first = create_or_get_transaction_intent(
                session,
                intent_id="intent-1",
                subject_key="subject-1",
                idempotency_key="request-1",
                request_fingerprint="a" * 64,
                now=NOW,
            )
            retry = create_or_get_transaction_intent(
                session,
                intent_id="ignored-on-retry",
                subject_key="subject-1",
                idempotency_key="request-1",
                request_fingerprint="a" * 64,
                now=NOW,
            )
            self.assertIs(first, retry)
            with self.assertRaises(TransactionConflict):
                create_or_get_transaction_intent(
                    session,
                    intent_id="intent-2",
                    subject_key="subject-1",
                    idempotency_key="request-1",
                    request_fingerprint="b" * 64,
                    now=NOW,
                )

    def test_durable_transaction_intent_transitions_follow_closed_state_machine(self) -> None:
        with Session(self.engine) as session:
            intent = create_or_get_transaction_intent(
                session,
                intent_id="intent-transition-1",
                subject_key="subject-transition-1",
                idempotency_key="request-transition-1",
                request_fingerprint="c" * 64,
                now=NOW,
            )
            signed = transition_transaction_intent(
                session,
                subject_key="subject-transition-1",
                idempotency_key="request-transition-1",
                next_status=TransactionStatus.SIGNED,
                now=NOW,
            )
            self.assertEqual(signed.status, TransactionStatus.SIGNED.value)
            with self.assertRaises(ValueError):
                transition_transaction_intent(
                    session,
                    subject_key="subject-transition-1",
                    idempotency_key="request-transition-1",
                    next_status=TransactionStatus.SUBMITTED,
                    now=NOW,
                )
            submitted = transition_transaction_intent(
                session,
                subject_key="subject-transition-1",
                idempotency_key="request-transition-1",
                next_status=TransactionStatus.SUBMITTED,
                transaction_hash="0x" + "a" * 64,
                now=NOW,
            )
            self.assertEqual(submitted.transaction_hash, "0x" + "a" * 64)
            pending = transition_transaction_intent(
                session,
                subject_key="subject-transition-1",
                idempotency_key="request-transition-1",
                next_status="pending",
                now=NOW,
            )
            self.assertEqual(pending.status, "pending")
            confirmed = transition_transaction_intent(
                session,
                subject_key="subject-transition-1",
                idempotency_key="request-transition-1",
                next_status=TransactionStatus.CONFIRMED,
                now=NOW,
            )
            self.assertEqual(confirmed.status, "confirmed")
            with self.assertRaises(InvalidTransactionTransition):
                transition_transaction_intent(
                    session,
                    subject_key="subject-transition-1",
                    idempotency_key="request-transition-1",
                    next_status=TransactionStatus.FAILED,
                    now=NOW,
                )
            with self.assertRaises(KeyError):
                transition_transaction_intent(
                    session,
                    subject_key="unknown-subject",
                    idempotency_key="unknown-request",
                    next_status=TransactionStatus.SIGNED,
                    now=NOW,
                )

    def test_invalid_initial_transaction_status_is_rejected(self) -> None:
        with Session(self.engine) as session:
            with self.assertRaises(ValueError):
                create_or_get_transaction_intent(
                    session,
                    intent_id="intent-invalid-status",
                    subject_key="subject-invalid-status",
                    idempotency_key="request-invalid-status",
                    request_fingerprint="d" * 64,
                    status="authoritative",
                    now=NOW,
                )

    def test_event_retry_returns_existing_and_content_change_fails(self) -> None:
        with Session(self.engine) as session:
            first = insert_canonical_event(session, canonical_event(payload=(("assetId", "1"),)), observed_at=NOW)
            retry = insert_canonical_event(session, canonical_event(payload=(("assetId", "1"),)), observed_at=NOW)
            self.assertIs(first, retry)
            with self.assertRaises(PersistenceConflict):
                insert_canonical_event(session, canonical_event(payload=(("assetId", "2"),)), observed_at=NOW)

    def test_reconciliation_finding_retry_is_deterministic_and_content_is_checked(self) -> None:
        finding = find_drift({"owner:7": "0x1"}, {"owner:7": "0x2"})[0]
        with Session(self.engine) as session:
            first = insert_reconciliation_finding(session, finding, observed_at=NOW)
            retry = insert_reconciliation_finding(session, finding, observed_at=NOW)
            self.assertIs(first, retry)
            self.assertEqual(len(first.id), 64)
            first.canonical_value = "tampered"
            with self.assertRaises(PersistenceConflict):
                insert_reconciliation_finding(session, finding, observed_at=NOW)

    def test_raw_log_retry_returns_existing_and_conflict_fails(self) -> None:
        event = canonical_event()
        raw = RawChainLog(1, event.block_hash, event.key.transaction_hash, event.key.log_index, event.key.contract_address, ("0x" + "a" * 64,), "0x")
        with Session(self.engine) as session:
            first = insert_raw_chain_log(session, event, raw, observed_at=NOW)
            retry = insert_raw_chain_log(session, event, raw, observed_at=NOW)
            self.assertIs(first, retry)
            conflicting = RawChainLog(1, event.block_hash, event.key.transaction_hash, event.key.log_index, event.key.contract_address, ("0x" + "b" * 64,), "0x")
            with self.assertRaises(PersistenceConflict):
                insert_raw_chain_log(session, event, conflicting, observed_at=NOW)

    def test_raw_log_must_match_event_identity(self) -> None:
        event = canonical_event()
        raw = RawChainLog(1, event.block_hash, "0x" + "9" * 64, event.key.log_index, event.key.contract_address, (), "0x")
        with Session(self.engine) as session:
            with self.assertRaises(PersistenceConflict):
                insert_raw_chain_log(session, event, raw, observed_at=NOW)

    def test_event_projection_status_is_closed(self) -> None:
        with Session(self.engine) as session:
            with self.assertRaises(ValueError):
                insert_canonical_event(session, canonical_event(), projection_status="authoritative", observed_at=NOW)

    def test_checkpoint_retry_promotes_finality_and_rejects_hash_conflict(self) -> None:
        with Session(self.engine) as session:
            first = record_block_checkpoint(session, chain_id=31337, block_number=1, block_hash="0x" + "3" * 64, finalized=False, observed_at=NOW)
            record_block_checkpoint(session, chain_id=31337, block_number=2, block_hash="0x" + "5" * 64, finalized=True, observed_at=NOW)
            retry = record_block_checkpoint(session, chain_id=31337, block_number=1, block_hash="0x" + "3" * 64, finalized=True, observed_at=NOW)
            self.assertIs(first, retry)
            self.assertTrue(retry.finalized)
            self.assertEqual(session.scalar(select(BlockCheckpoint).where(BlockCheckpoint.block_number == 1)).block_hash, "0x" + "3" * 64)
            with self.assertRaises(PersistenceConflict):
                record_block_checkpoint(session, chain_id=31337, block_number=1, block_hash="0x" + "4" * 64, finalized=True, observed_at=NOW)
            self.assertEqual(remove_checkpoints_from(session, chain_id=31337, block_number=2), 1)
            self.assertIsNotNone(session.get(BlockCheckpoint, (31337, 1)))
            self.assertIsNone(session.get(BlockCheckpoint, (31337, 2)))

    def test_reorg_marks_only_affected_contract_events_uncertain_and_replay_restores(self) -> None:
        original = canonical_event()
        other_contract = CanonicalEvent(EventKey(31337, "0x" + "9" * 40, "0x" + "8" * 64, 0), 4, "0x" + "7" * 64, "Other", ())
        with Session(self.engine) as session:
            insert_canonical_event(session, original, observed_at=NOW)
            insert_canonical_event(session, other_contract, observed_at=NOW)
            self.assertEqual(mark_events_uncertain_from(session, chain_id=31337, contract_address="0x" + "1" * 40, block_number=1), 1)
            affected = session.get(CanonicalEventRecord, "31337:0x" + "1" * 40 + ":0x" + "2" * 64 + ":0:1")
            untouched = session.get(CanonicalEventRecord, "31337:0x" + "9" * 40 + ":0x" + "8" * 64 + ":0:1")
            self.assertEqual(affected.projection_status, "uncertain")
            self.assertEqual(untouched.projection_status, "canonical")
            restored = restore_replayed_event(session, original, observed_at=NOW)
            self.assertIs(restored, affected)
            self.assertEqual(restored.projection_status, "canonical")


if __name__ == "__main__":
    unittest.main()
