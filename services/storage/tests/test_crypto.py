from __future__ import annotations

import unittest
from dataclasses import replace

from services.storage.crypto import (
    ALGORITHM,
    ENVELOPE_VERSION,
    EncryptionError,
    EncryptedBlob,
    decrypt,
    encrypt,
)


class EncryptionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.key = bytes(range(32))
        self.context = b"tenant=local;asset=BEL-LAB-001;version=1"
        self.plaintext = b"disposable local fixture; no real identity data"

    def test_round_trip_and_serialization(self) -> None:
        blob = encrypt(self.plaintext, self.key, associated_data=self.context)
        restored = EncryptedBlob.from_dict(blob.to_dict())
        self.assertEqual(decrypt(restored, self.key, associated_data=self.context), self.plaintext)
        self.assertEqual(restored.version, ENVELOPE_VERSION)
        self.assertEqual(restored.algorithm, ALGORITHM)
        self.assertEqual(len(restored.nonce), 12)

    def test_tampering_fails_authentication(self) -> None:
        blob = encrypt(self.plaintext, self.key, associated_data=self.context)
        tampered = replace(blob, ciphertext=blob.ciphertext[:-1] + bytes([blob.ciphertext[-1] ^ 1]))
        with self.assertRaises(EncryptionError):
            decrypt(tampered, self.key, associated_data=self.context)

    def test_associated_data_is_bound_to_ciphertext(self) -> None:
        blob = encrypt(self.plaintext, self.key, associated_data=self.context)
        with self.assertRaises(EncryptionError):
            decrypt(blob, self.key, associated_data=b"tenant=other;asset=BEL-LAB-001;version=1")

    def test_invalid_key_and_envelope_fail_closed(self) -> None:
        with self.assertRaises(EncryptionError):
            encrypt(self.plaintext, b"short", associated_data=self.context)
        blob = encrypt(self.plaintext, self.key, associated_data=self.context)
        invalid = blob.to_dict()
        invalid["algorithm"] = "AES-128-GCM"
        with self.assertRaises(EncryptionError):
            EncryptedBlob.from_dict(invalid)
        invalid = blob.to_dict()
        invalid["nonce"] = "AA=="
        with self.assertRaises(EncryptionError):
            EncryptedBlob.from_dict(invalid)


if __name__ == "__main__":
    unittest.main()
