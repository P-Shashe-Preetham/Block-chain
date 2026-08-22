from __future__ import annotations

import unittest

from services.api.transactions import (
    InMemoryTransactionStore,
    InvalidTransactionTransition,
    TransactionConflict,
    TransactionStatus,
)


class TransactionStateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.store = InMemoryTransactionStore()
        self.key = "request-0001"
        self.request_hash = "sha256:request-1"
        self.contract = "0x0000000000000000000000000000000000000001"

    def test_same_idempotency_key_and_request_returns_existing_record(self) -> None:
        first = self.store.create(
            idempotency_key=self.key,
            request_hash=self.request_hash,
            chain_id=31337,
            contract_address=self.contract,
        )
        second = self.store.create(
            idempotency_key=self.key,
            request_hash=self.request_hash,
            chain_id=31337,
            contract_address=self.contract,
        )
        self.assertEqual(first, second)

    def test_reusing_idempotency_key_for_different_request_is_rejected(self) -> None:
        self.store.create(
            idempotency_key=self.key,
            request_hash=self.request_hash,
            chain_id=31337,
            contract_address=self.contract,
        )
        with self.assertRaises(TransactionConflict):
            self.store.create(
                idempotency_key=self.key,
                request_hash="sha256:another-request",
                chain_id=31337,
                contract_address=self.contract,
            )

    def test_submission_requires_hash_and_success_requires_confirmed_path(self) -> None:
        self.store.create(
            idempotency_key=self.key,
            request_hash=self.request_hash,
            chain_id=31337,
            contract_address=self.contract,
        )
        with self.assertRaises(ValueError):
            self.store.transition(self.key, TransactionStatus.SUBMITTED)
        self.store.transition(self.key, TransactionStatus.SIGNED)
        self.store.transition(self.key, TransactionStatus.SUBMITTED, tx_hash="0xtx")
        self.store.transition(self.key, TransactionStatus.PENDING)
        confirmed = self.store.transition(self.key, TransactionStatus.CONFIRMED)
        self.assertEqual(confirmed.status, TransactionStatus.CONFIRMED)
        self.assertTrue(self.store.is_terminal(self.key))

    def test_illegal_transition_after_terminal_state_is_rejected(self) -> None:
        self.store.create(
            idempotency_key=self.key,
            request_hash=self.request_hash,
            chain_id=31337,
            contract_address=self.contract,
        )
        self.store.transition(self.key, TransactionStatus.FAILED)
        with self.assertRaises(InvalidTransactionTransition):
            self.store.transition(self.key, TransactionStatus.PENDING, tx_hash="0xtx")


if __name__ == "__main__":
    unittest.main()
