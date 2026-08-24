from __future__ import annotations

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from services.api.auth import Principal
from services.api.intents import SQLAlchemyTransactionIntentWriter, TransactionIntentRequest
from services.api.transactions import TransactionConflict, TransactionStatus
from services.persistence.models import Base
from services.persistence.repository import create_or_get_transaction_intent


class SQLAlchemyTransactionIntentWriterTests(unittest.TestCase):
    def setUp(self) -> None:
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.session_factory = sessionmaker(engine, expire_on_commit=False)
        self.writer = SQLAlchemyTransactionIntentWriter(self.session_factory, create_or_get_transaction_intent)
        self.principal = Principal("subject-1", frozenset({"MANAGER_ROLE"}), frozenset(), "fixture", "fixture")

    def test_identical_retry_returns_same_durable_intent_without_chain_submission(self) -> None:
        request = TransactionIntentRequest(operation="register_asset", arguments={"asset_id": "prototype-1"})
        first = self.writer.create_or_get(
            principal=self.principal,
            idempotency_key="request-001",
            request=request,
            chain_id=31337,
            contract_address="0x" + "1" * 40,
        )
        retry = self.writer.create_or_get(
            principal=self.principal,
            idempotency_key="request-001",
            request=request,
            chain_id=31337,
            contract_address="0x" + "1" * 40,
        )
        self.assertEqual(first.intent_id, retry.intent_id)
        self.assertEqual(first.status, TransactionStatus.REQUESTED)
        self.assertEqual(first.request_fingerprint, retry.request_fingerprint)

    def test_conflicting_retry_fails_closed(self) -> None:
        first_request = TransactionIntentRequest(operation="register_asset", arguments={"asset_id": "prototype-1"})
        second_request = TransactionIntentRequest(operation="register_asset", arguments={"asset_id": "prototype-2"})
        self.writer.create_or_get(
            principal=self.principal,
            idempotency_key="request-002",
            request=first_request,
            chain_id=31337,
            contract_address="0x" + "1" * 40,
        )
        with self.assertRaises(TransactionConflict):
            self.writer.create_or_get(
                principal=self.principal,
                idempotency_key="request-002",
                request=second_request,
                chain_id=31337,
                contract_address="0x" + "1" * 40,
            )

    def test_subject_and_key_validation_is_strict(self) -> None:
        request = TransactionIntentRequest(operation="register_asset")
        with self.assertRaises(ValueError):
            self.writer.create_or_get(
                principal=Principal("", frozenset(), frozenset(), "fixture", "fixture"),
                idempotency_key="request-003",
                request=request,
                chain_id=31337,
                contract_address="0x" + "1" * 40,
            )
        with self.assertRaises(ValueError):
            self.writer.create_or_get(
                principal=self.principal,
                idempotency_key="short",
                request=request,
                chain_id=31337,
                contract_address="0x" + "1" * 40,
            )


if __name__ == "__main__":
    unittest.main()
