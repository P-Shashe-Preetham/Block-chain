from __future__ import annotations

import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from services.persistence.models import Base, BlockCheckpoint, CanonicalEventRecord, TransactionIntent


NOW = datetime.now(timezone.utc)


class PersistenceModelTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)

    def test_transaction_intent_subject_and_idempotency_are_unique(self) -> None:
        intent = TransactionIntent(
            id="intent-1",
            subject_key="subject-1",
            idempotency_key="request-1",
            request_fingerprint="a" * 64,
            status="requested",
            created_at=NOW,
            updated_at=NOW,
        )
        with Session(self.engine) as session:
            session.add(intent)
            session.commit()
            duplicate = TransactionIntent(
                id="intent-2",
                subject_key="subject-1",
                idempotency_key="request-1",
                request_fingerprint="b" * 64,
                status="requested",
                created_at=NOW,
                updated_at=NOW,
            )
            session.add(duplicate)
            with self.assertRaises(IntegrityError):
                session.commit()

    def test_canonical_event_identity_is_unique(self) -> None:
        event = CanonicalEventRecord(
            id="event-1",
            chain_id=31337,
            contract_address="0x0000000000000000000000000000000000000001",
            transaction_hash="0x" + "1" * 64,
            log_index=0,
            event_version=1,
            block_number=1,
            block_hash="0x" + "2" * 64,
            event_name="AssetRegistered",
            payload_json="{}",
            projection_status="canonical",
            observed_at=NOW,
        )
        with Session(self.engine) as session:
            session.add(event)
            session.commit()
            duplicate = CanonicalEventRecord(
                id="event-2",
                chain_id=31337,
                contract_address=event.contract_address,
                transaction_hash=event.transaction_hash,
                log_index=event.log_index,
                event_version=event.event_version,
                block_number=1,
                block_hash=event.block_hash,
                event_name=event.event_name,
                payload_json=event.payload_json,
                projection_status="canonical",
                observed_at=NOW,
            )
            session.add(duplicate)
            with self.assertRaises(IntegrityError):
                session.commit()

    def test_block_checkpoint_uses_chain_and_block_as_primary_key(self) -> None:
        with Session(self.engine) as session:
            session.add(BlockCheckpoint(chain_id=31337, block_number=1, block_hash="0x" + "3" * 64, observed_at=NOW))
            session.commit()
            result = session.scalars(select(BlockCheckpoint)).all()
        self.assertEqual(len(result), 1)
        self.assertTrue(result[0].finalized is False)


if __name__ == "__main__":
    unittest.main()
