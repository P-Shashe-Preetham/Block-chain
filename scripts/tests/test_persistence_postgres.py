from __future__ import annotations

import os
import unittest
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from services.indexer.consumer import RawChainLog
from services.indexer.projector import CanonicalEvent, EventKey
from services.persistence.database import DatabaseSettings, create_database_engine
from services.persistence.models import Base, BlockCheckpoint, CanonicalEventRecord, RawChainLogRecord, TransactionIntent
from services.persistence.repository import (
    PersistenceConflict,
    create_or_get_transaction_intent,
    insert_canonical_event,
    insert_raw_chain_log,
    record_block_checkpoint,
)


DATABASE_URL = os.environ.get("DATABASE_URL", "")
POSTGRES_INTEGRATION_ENABLED = os.environ.get("PERSISTENCE_POSTGRES_INTEGRATION") == "1"


def canonical_event() -> CanonicalEvent:
    return CanonicalEvent(
        EventKey(31337, "0x" + "1" * 40, "0x" + "2" * 64, 0),
        1,
        "0x" + "3" * 64,
        "AssetRegistered",
        (("assetId", "1"),),
    )


@unittest.skipUnless(
    POSTGRES_INTEGRATION_ENABLED and DATABASE_URL.startswith("postgresql"),
    "set PERSISTENCE_POSTGRES_INTEGRATION=1 and DATABASE_URL to run the genuine integration suite",
)
class PostgreSQLPersistenceIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = create_database_engine(DatabaseSettings("ci", DATABASE_URL, "disable"))
        with cls.engine.connect() as connection:
            cls.asserted_database = connection.scalar(text("SELECT current_database()"))
        if not cls.asserted_database:
            raise AssertionError("PostgreSQL integration connection did not identify a database")

    @classmethod
    def tearDownClass(cls) -> None:
        cls.engine.dispose()

    def setUp(self) -> None:
        with self.engine.begin() as connection:
            for table in reversed(Base.metadata.sorted_tables):
                connection.execute(table.delete())

    def test_migration_schema_and_transactional_projection_round_trip(self) -> None:
        now = datetime.now(timezone.utc)
        event = canonical_event()
        raw = RawChainLog(
            1,
            event.block_hash,
            event.key.transaction_hash,
            event.key.log_index,
            event.key.contract_address,
            ("0x" + "a" * 64,),
            "0x",
        )
        with Session(self.engine) as session:
            with session.begin():
                intent = create_or_get_transaction_intent(
                    session,
                    intent_id="intent-postgres-1",
                    subject_key="subject-postgres-1",
                    idempotency_key="request-postgres-1",
                    request_fingerprint="a" * 64,
                    now=now,
                )
                insert_raw_chain_log(session, event, raw, observed_at=now)
                insert_canonical_event(session, event, projection_status="unfinalized", observed_at=now)
                record_block_checkpoint(
                    session,
                    chain_id=31337,
                    block_number=1,
                    block_hash=event.block_hash,
                    finalized=False,
                    observed_at=now,
                )
                intent_id = intent.id

        with Session(self.engine) as session:
            self.assertEqual(session.get(TransactionIntent, intent_id).status, "requested")
            self.assertIsNotNone(session.get(RawChainLogRecord, "31337:0x" + "1" * 40 + ":0x" + "2" * 64 + ":0:1"))
            event_id = "31337:0x" + "1" * 40 + ":0x" + "2" * 64 + ":0:1"
            stored = session.get(CanonicalEventRecord, event_id)
            self.assertIsNotNone(stored)
            self.assertEqual(stored.projection_status, "unfinalized")
            self.assertIsNotNone(session.get(BlockCheckpoint, (31337, 1)))

    def test_postgresql_unique_and_content_conflicts_are_enforced(self) -> None:
        event = canonical_event()
        with Session(self.engine) as session:
            with session.begin():
                first = create_or_get_transaction_intent(
                    session,
                    intent_id="intent-postgres-2",
                    subject_key="subject-postgres-2",
                    idempotency_key="request-postgres-2",
                    request_fingerprint="b" * 64,
                )
                retry = create_or_get_transaction_intent(
                    session,
                    intent_id="ignored-postgres-2",
                    subject_key="subject-postgres-2",
                    idempotency_key="request-postgres-2",
                    request_fingerprint="b" * 64,
                )
                self.assertEqual(first.id, retry.id)
                insert_canonical_event(session, event)
                with self.assertRaises(PersistenceConflict):
                    insert_canonical_event(
                        session,
                        CanonicalEvent(
                            event.key,
                            event.key.event_version,
                            event.block_hash,
                            event.name,
                            (("assetId", "different"),),
                        ),
                    )

        with Session(self.engine) as session:
            self.assertEqual(session.query(TransactionIntent).count(), 1)
            self.assertEqual(session.query(CanonicalEventRecord).count(), 1)


if __name__ == "__main__":
    unittest.main()
