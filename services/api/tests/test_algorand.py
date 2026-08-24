"""Unit and integration tests for Algorand SDK, PyTeal compilation, and API routes."""

from __future__ import annotations

import unittest
from services.api.algorand import AlgorandService
from services.api.algorand_routes import router
from smart_contracts.algorand.contracts import compile_contracts
from services.storage.crypto import KEY_BYTES


class AlgorandServiceTests(unittest.TestCase):
    def test_pyteal_contracts_compile(self) -> None:
        compiled = compile_contracts()
        self.assertIn("identity_approval", compiled)
        self.assertIn("rbac_approval", compiled)
        self.assertIn("asset_vault_approval", compiled)
        self.assertTrue(len(compiled["identity_approval"]) > 100)
        self.assertTrue(len(compiled["rbac_approval"]) > 100)
        self.assertTrue(len(compiled["asset_vault_approval"]) > 100)

    def test_account_generation(self) -> None:
        service = AlgorandService()
        acc = service.generate_account()
        self.assertIn("address", acc)
        self.assertIn("mnemonic", acc)
        self.assertEqual(len(acc["address"]), 58) # Algorand standard address length

    def test_payload_encryption_and_hash(self) -> None:
        service = AlgorandService()
        key = b"\x01" * KEY_BYTES
        payload = b"Top secret identity reference payload"
        blob, payload_hash = service.encrypt_and_hash_payload(payload, key)
        self.assertEqual(len(payload_hash), 32) # SHA-256 hash length for ASA metadata
        self.assertEqual(blob.version, 1)
        self.assertEqual(blob.algorithm, "AES-256-GCM")


if __name__ == "__main__":
    unittest.main()
