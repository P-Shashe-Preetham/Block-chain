import unittest

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from services.indexer.consumer import RawChainLog
from services.indexer.persistent import PersistentProjection
from services.indexer.projector import CanonicalEvent, EventKey
from services.persistence.models import Base, CanonicalEventRecord, ReconciliationFinding
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


def raw_log(block: int = 10, tx: str = "2") -> RawChainLog:
    return RawChainLog(block, "0x" + "3" * 64, "0x" + tx * 64, 0, CONTRACT, ("0x" + "aa" * 32,), "0x")


class PersistentProjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)

    def test_ingest_is_unfinalized_then_promotes_at_confirmation_depth(self):
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=2)
            projection.checkpoint(10, "0x" + "3" * 64, head_block=10)
            record = projection.ingest(event(), raw_log=raw_log(), head_block=10)
            self.assertEqual(record.projection_status, "unfinalized")
            projection.checkpoint(12, "0x" + "5" * 64, head_block=12)
            self.assertEqual(record.projection_status, "canonical")

    def test_reorg_withholds_records_and_matching_replay_restores_them(self):
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=1)
            projection.checkpoint(10, "0x" + "3" * 64, head_block=11)
            original = event()
            projection.ingest(original, raw_log=raw_log(), head_block=11)
            self.assertEqual(projection.rollback_from(10), 1)
            record = session.scalar(select(CanonicalEventRecord))
            self.assertEqual(record.projection_status, "uncertain")
            restored = projection.restore_replayed(original)
            self.assertEqual(restored.projection_status, "canonical")

    def test_reconciliation_persists_drift_without_repair(self):
        canonical = {"owner:7": "0x1", "status:7": "active"}
        projected = {"owner:7": "0x2", "extra:7": "stale"}
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=1)
            findings = projection.record_reconciliation(canonical, projected)
            self.assertEqual(tuple(item.kind for item in findings), ("unexpected_projection", "value_mismatch", "missing_projection"))
            self.assertEqual(canonical, {"owner:7": "0x1", "status:7": "active"})
            self.assertEqual(projected, {"owner:7": "0x2", "extra:7": "stale"})
            self.assertEqual(len(session.query(ReconciliationFinding).all()), 3)
            self.assertTrue(all(item.status == "open" for item in session.query(ReconciliationFinding).all()))

    def test_scope_is_closed_to_other_chain_or_contract(self):
        with Session(self.engine) as session:
            projection = PersistentProjection(session, chain_id=CHAIN_ID, contract_address=CONTRACT, confirmations=1)
            with self.assertRaises(PersistenceConflict):
                projection.ingest(CanonicalEvent(EventKey(CHAIN_ID + 1, CONTRACT, "0x" + "2" * 64, 0), 1, "0x" + "3" * 64, "Other", ()), raw_log=raw_log(block=1), head_block=2)
            with self.assertRaises(PersistenceConflict):
                projection.restore_replayed(CanonicalEvent(EventKey(CHAIN_ID, "0x" + "9" * 40, "0x" + "2" * 64, 0), 1, "0x" + "3" * 64, "Other", ()))


if __name__ == "__main__":
    unittest.main()
