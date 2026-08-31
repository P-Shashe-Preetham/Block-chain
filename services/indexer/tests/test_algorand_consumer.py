"""Unit tests for Algorand Indexer log consumer and PyTeal log decoder."""

from __future__ import annotations

import base64
import unittest
from services.indexer.algorand_consumer import AlgorandIndexerConsumer, AlgorandLogDecoder


class AlgorandLogDecoderTests(unittest.TestCase):
    def test_decode_access_decision_log(self) -> None:
        raw_log = "ACCESS_DECISION:GRANTED:ASSET:1001"
        b64_log = base64.b64encode(raw_log.encode("utf-8")).decode("ascii")

        decoded = AlgorandLogDecoder.decode_log(b64_log)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["event_name"], "AccessDecision")
        self.assertEqual(decoded["status"], "GRANTED")
        self.assertEqual(decoded["asset_id"], "1001")

    def test_decode_did_registered_log(self) -> None:
        raw_log = "DID_REGISTERED:did:algo:subject001"
        b64_log = base64.b64encode(raw_log.encode("utf-8")).decode("ascii")

        decoded = AlgorandLogDecoder.decode_log(b64_log)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["event_name"], "DIDRegistered")
        self.assertEqual(decoded["subject_did"], "did:algo:subject001")

    def test_parse_transaction_to_canonical_record(self) -> None:
        consumer = AlgorandIndexerConsumer()
        mock_tx = {
            "id": "ALGO_TX_TEST_001",
            "confirmed-round": 10240,
            "application-transaction": {"application-id": 1003},
            "logs": [
                base64.b64encode(b"ACCESS_DECISION:GRANTED:ASSET:1001").decode("ascii")
            ],
        }

        record = consumer.parse_transaction_to_canonical_record(mock_tx)
        self.assertIsNotNone(record)
        self.assertEqual(record.transaction_hash, "ALGO_TX_TEST_001")
        self.assertEqual(record.block_number, 10240)
        self.assertEqual(record.event_name, "AccessDecision")
        self.assertEqual(record.projection_status, "canonical")


if __name__ == "__main__":
    unittest.main()
