from __future__ import annotations

import unittest

from services.indexer.reconcile import find_drift


class ReconciliationTests(unittest.TestCase):
    def test_reports_deterministic_drift_without_mutating_inputs(self) -> None:
        canonical = {"asset:1:owner": "0xowner-a", "asset:1:status": "ACTIVE", "role:manager": "0xmanager"}
        projected = {"asset:1:owner": "0xowner-b", "asset:1:status": "ACTIVE", "stale:key": "value"}
        drifts = find_drift(canonical, projected)
        self.assertEqual([(item.key, item.kind) for item in drifts], [
            ("asset:1:owner", "value_mismatch"),
            ("role:manager", "missing_projection"),
            ("stale:key", "unexpected_projection"),
        ])
        self.assertEqual(canonical["asset:1:owner"], "0xowner-a")
        self.assertEqual(projected["asset:1:owner"], "0xowner-b")

    def test_empty_drift_is_clean(self) -> None:
        self.assertEqual(find_drift({"asset:1:status": "ACTIVE"}, {"asset:1:status": "ACTIVE"}), ())

    def test_invalid_records_fail_closed(self) -> None:
        with self.assertRaises(ValueError):
            find_drift({"": "value"}, {})
        with self.assertRaises(ValueError):
            find_drift({"key": 1}, {})  # type: ignore[arg-type]


if __name__ == "__main__":
    unittest.main()
