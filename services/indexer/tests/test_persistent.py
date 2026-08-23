import unittest

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from services.indexer.persistent import PersistentProjection
from services.indexer.projector import CanonicalEvent, EventKey
from services.persistence.models import Base, CanonicalEventRecord
from services.persistence.repository import PersistenceConflict


CHAIN_ID = 31337
CONTRACT = "0x" + "1" * 40


def event(block: int = 10, tx: str = "2") -> CanonicalEvent:
    return CanonicalEvent(
        EventKey(CHAIN_ID, CONTRACT, "0x" + tx * 64, 0),
        block,
        "0x" + "3" * 64,
        "IdentityRegistered",
        (("subject", "0x" + "4" * 40),),
    )


class PersistentProjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)

    def test_ingest_is_unfinalized_then_promotes_at_confirmation_depth(self):
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=2)
            projection.checkpoint(10, "0x" + "3" * 64, head_block=10)
            record = projection.ingest(event(), head_block=10)
            self.assertEqual(record.projection_status, "unfinalized")
            projection.checkpoint(12, "0x" + "5" * 64, head_block=12)
            self.assertEqual(record.projection_status, "canonical")

    def test_reorg_withholds_records_and_matching_replay_restores_them(self):
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=1)
            projection.checkpoint(10, "0x" + "3" * 64, head_block=11)
            original = event()
            projection.ingest(original, head_block=11)
            self.assertEqual(projection.rollback_from(10), 1)
            record = session.scalar(select(CanonicalEventRecord))
            self.assertEqual(record.projection_status, "uncertain")
            restored = projection.restore_replayed(original)
            self.assertEqual(restored.projection_status, "canonical")

    def test_scope_is_closed_to_other_chain_or_contract(self):
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=1)
            with self.assertRaises(PersistenceConflict):
                projection.ingest(CanonicalEvent(EventKey(CHAIN_ID + 1, CONTRACT, "0x" + "2" * 64, 0), 1, "0x" + "3" * 64, "Other", ()), head_block=2)
            with self.assertRaises(PersistenceConflict):
                projection.restore_replayed(CanonicalEvent(EventKey(CHAIN_ID, "0x" + "9" * 40, "0x" + "2" * 64, 0), 1, "0x" + "3" * 64, "Other", ()))


if __name__ == "__main__":
    unittest.main()
