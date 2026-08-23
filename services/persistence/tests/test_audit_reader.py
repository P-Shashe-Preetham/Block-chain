from __future__ import annotations

import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine, update
from sqlalchemy.orm import Session, sessionmaker

from services.api.audit import AuditReaderUnavailable, ProjectionStatus
from services.indexer.projector import CanonicalEvent, EventKey
from services.persistence.audit_reader import SQLAlchemyAuditReader
from services.persistence.models import Base, CanonicalEventRecord
from services.persistence.repository import insert_canonical_event


NOW = datetime.now(timezone.utc)
CONTRACT = "0x" + "1" * 40
OTHER_CONTRACT = "0x" + "9" * 40


def event(block: int, tx_digit: str, *, status: str = "canonical", contract: str = CONTRACT) -> CanonicalEvent:
    return CanonicalEvent(
        EventKey(31337, contract, "0x" + tx_digit * 64, 0),
        block,
        "0x" + str(block).zfill(2) * 32,
        "AssetRegistered",
        (("assetId", str(block)),),
    )


class SQLAlchemyAuditReaderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(self.engine, expire_on_commit=False)
        with self.session_factory() as session:
            with session.begin():
                insert_canonical_event(session, event(2, "2"), projection_status="uncertain", observed_at=NOW)
                insert_canonical_event(session, event(1, "1"), projection_status="canonical", observed_at=NOW)
                insert_canonical_event(session, event(3, "3"), projection_status="unfinalized", observed_at=NOW)
                insert_canonical_event(session, event(4, "4", contract=OTHER_CONTRACT), observed_at=NOW)

    def test_reader_is_scoped_ordered_and_sanitized(self) -> None:
        reader = SQLAlchemyAuditReader(self.session_factory, chain_id=31337, contract_address=CONTRACT)
        records = reader.list_events(limit=10, projection_status=None)
        self.assertEqual([record.block_number for record in records], [1, 2, 3])
        self.assertEqual(records[1].projection_status, ProjectionStatus.UNCERTAIN)
        self.assertFalse(hasattr(records[0], "payload_json"))

    def test_reader_filters_status_and_bounds_limit(self) -> None:
        reader = SQLAlchemyAuditReader(self.session_factory, chain_id=31337, contract_address=CONTRACT)
        records = reader.list_events(limit=1, projection_status=ProjectionStatus.UNCERTAIN)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].event_id, "31337:" + CONTRACT + ":0x" + "2" * 64 + ":0:1")
        with self.assertRaises(ValueError):
            reader.list_events(limit=0, projection_status=None)
        with self.assertRaises(ValueError):
            reader.list_events(limit=101, projection_status=None)

    def test_unknown_projection_status_fails_closed(self) -> None:
        with self.session_factory() as session:
            session.execute(
                update(CanonicalEventRecord)
                .where(CanonicalEventRecord.event_name == "AssetRegistered")
                .values(projection_status="authoritative")
            )
            session.commit()
        reader = SQLAlchemyAuditReader(self.session_factory, chain_id=31337, contract_address=CONTRACT)
        with self.assertRaises(AuditReaderUnavailable):
            reader.list_events(limit=10, projection_status=None)


if __name__ == "__main__":
    unittest.main()
