from __future__ import annotations

import unittest

from services.indexer.projector import (
    BlockGap,
    CanonicalEvent,
    EventKey,
    InMemoryProjection,
    ProjectionConflict,
)


def event(block: int, *, tx: str = "0xtx", log: int = 0, block_hash: str | None = None) -> CanonicalEvent:
    return CanonicalEvent(
        key=EventKey(31337, "0xcontract", tx, log),
        block_number=block,
        block_hash=block_hash or f"0xblock-{block}",
        name="AssetRegistered",
        payload=(("assetId", str(block)),),
    )


class ProjectionTests(unittest.TestCase):
    def test_duplicate_event_is_a_noop(self) -> None:
        projection = InMemoryProjection()
        first = event(1)
        self.assertTrue(projection.ingest(first))
        self.assertFalse(projection.ingest(first))
        self.assertEqual(projection.events, (first,))

    def test_gap_is_rejected_unless_explicitly_allowed(self) -> None:
        projection = InMemoryProjection()
        projection.checkpoint(10, "0xblock-10")
        with self.assertRaises(BlockGap):
            projection.checkpoint(12, "0xblock-12")
        self.assertTrue(projection.checkpoint(12, "0xblock-12", allow_gap=True))
        with self.assertRaises(BlockGap):
            projection.verify_contiguous_blocks()

    def test_confirmation_depth_separates_finalized_and_unfinalized_events(self) -> None:
        projection = InMemoryProjection()
        projection.checkpoint(1, "0xblock-1")
        projection.ingest(event(1))
        projection.checkpoint(2, "0xblock-2")
        projection.checkpoint(3, "0xblock-3")
        self.assertEqual(projection.finalized_events(3, confirmations=2), (event(1),))
        self.assertEqual(projection.unfinalized_events(3, confirmations=2), ())
        self.assertEqual(projection.unfinalized_events(2, confirmations=2), (event(1),))
        with self.assertRaises(ValueError):
            projection.finalized_events(3, confirmations=-1)

    def test_same_block_with_different_hash_is_rejected(self) -> None:
        projection = InMemoryProjection()
        projection.checkpoint(4, "0xblock-4")
        projection.ingest(event(4))
        with self.assertRaises(ProjectionConflict):
            projection.ingest(event(4, tx="0xtx-4b", block_hash="0xother"))

    def test_reorg_rollback_removes_affected_events_and_allows_replay(self) -> None:
        projection = InMemoryProjection()
        projection.checkpoint(1, "0xblock-1")
        projection.ingest(event(1))
        projection.checkpoint(2, "0xblock-2")
        projection.ingest(event(2, tx="0xtx-2"))
        projection.checkpoint(3, "0xblock-3")
        projection.ingest(event(3, tx="0xtx-3"))
        self.assertEqual(projection.rollback_from(2), 2)
        self.assertEqual(projection.last_processed_block, 1)
        replacement = event(2, tx="0xreplacement", block_hash="0xnew-block-2")
        projection.checkpoint(2, "0xnew-block-2")
        self.assertTrue(projection.ingest(replacement))
        self.assertEqual(projection.last_processed_block, 2)
        self.assertEqual(projection.events, (event(1), replacement))


if __name__ == "__main__":
    unittest.main()
