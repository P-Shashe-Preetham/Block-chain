from __future__ import annotations

import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from services.api.transactions import TransactionConflict
from services.indexer.projector import CanonicalEvent, EventKey
from services.persistence.models import Base
from services.persistence.repository import PersistenceConflict, create_or_get_transaction_intent, insert_canonical_event


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

    def test_event_retry_returns_existing_and_content_change_fails(self) -> None:
        with Session(self.engine) as session:
            first = insert_canonical_event(session, canonical_event(payload=(("assetId", "1"),)), observed_at=NOW)
            retry = insert_canonical_event(session, canonical_event(payload=(("assetId", "1"),)), observed_at=NOW)
            self.assertIs(first, retry)
            with self.assertRaises(PersistenceConflict):
                insert_canonical_event(session, canonical_event(payload=(("assetId", "2"),)), observed_at=NOW)


if __name__ == "__main__":
    unittest.main()
