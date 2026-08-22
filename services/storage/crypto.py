"""Local reference envelope encryption for off-chain payloads.

This module encrypts bytes but deliberately does not generate, persist, wrap,
release, rotate, or recover keys. A production adapter must obtain the 32-byte
key from an approved KMS/HSM and keep the key lifecycle outside this envelope.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from secrets import token_bytes

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


ENVELOPE_VERSION = 1
ALGORITHM = "AES-256-GCM"
NONCE_BYTES = 12
KEY_BYTES = 32


class EncryptionError(ValueError):
    """Raised when an envelope, key, or authentication context is invalid."""


@dataclass(frozen=True)
class EncryptedBlob:
    version: int
    algorithm: str
    nonce: bytes
    ciphertext: bytes
    associated_data: bytes

    def to_dict(self) -> dict[str, object]:
        return {
            "version": self.version,
            "algorithm": self.algorithm,
            "nonce": _encode(self.nonce),
            "ciphertext": _encode(self.ciphertext),
            "associatedData": _encode(self.associated_data),
        }

    @classmethod
    def from_dict(cls, value: object) -> "EncryptedBlob":
        if not isinstance(value, dict):
            raise EncryptionError("envelope must be an object")
        try:
            version = value["version"]
            algorithm = value["algorithm"]
            nonce = _decode(value["nonce"])
            ciphertext = _decode(value["ciphertext"])
            associated_data = _decode(value["associatedData"])
        except (KeyError, TypeError, ValueError) as error:
            raise EncryptionError("envelope fields are invalid") from error
        if version != ENVELOPE_VERSION or algorithm != ALGORITHM:
            raise EncryptionError("unsupported encryption envelope")
        if len(nonce) != NONCE_BYTES or len(ciphertext) < 16:
            raise EncryptionError("invalid AES-GCM nonce or ciphertext")
        return cls(version, algorithm, nonce, ciphertext, associated_data)


def encrypt(plaintext: bytes, key: bytes, *, associated_data: bytes = b"") -> EncryptedBlob:
    _validate_key(key)
    if not isinstance(plaintext, bytes) or not isinstance(associated_data, bytes):
        raise EncryptionError("plaintext and associated data must be bytes")
    nonce = token_bytes(NONCE_BYTES)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, associated_data)
    return EncryptedBlob(ENVELOPE_VERSION, ALGORITHM, nonce, ciphertext, associated_data)


def decrypt(blob: EncryptedBlob, key: bytes, *, associated_data: bytes = b"") -> bytes:
    _validate_key(key)
    if not isinstance(blob, EncryptedBlob):
        raise EncryptionError("blob must be an EncryptedBlob")
    if blob.version != ENVELOPE_VERSION or blob.algorithm != ALGORITHM:
        raise EncryptionError("unsupported encryption envelope")
    if blob.associated_data != associated_data:
        raise EncryptionError("associated-data context mismatch")
    try:
        return AESGCM(key).decrypt(blob.nonce, blob.ciphertext, associated_data)
    except InvalidTag as error:
        raise EncryptionError("ciphertext authentication failed") from error


def _validate_key(key: bytes) -> None:
    if not isinstance(key, bytes) or len(key) != KEY_BYTES:
        raise EncryptionError("AES-256-GCM requires a 32-byte key")


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii")


def _decode(value: object) -> bytes:
    if not isinstance(value, str):
        raise EncryptionError("encoded envelope values must be strings")
    try:
        return base64.urlsafe_b64decode(value.encode("ascii"))
    except (ValueError, UnicodeError) as error:
        raise EncryptionError("invalid base64 envelope value") from error
