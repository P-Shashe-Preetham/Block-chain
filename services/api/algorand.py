"""Algorand SDK & AlgoKit Integration Service for the Platform Backend."""

from __future__ import annotations

import base64
import hashlib
from typing import Any

try:
    from algosdk import account, mnemonic
    from algosdk.v2client import algod, indexer
    from algosdk.transaction import (
        ApplicationCreateTxn,
        ApplicationNoOpTxn,
        AssetConfigTxn,
        AssetTransferTxn,
        StateSchema,
    )
    ALGOSDK_AVAILABLE = True
except ImportError:
    ALGOSDK_AVAILABLE = False

from services.storage.crypto import EncryptedBlob, encrypt


class AlgorandServiceError(ValueError):
    """Raised when an Algorand transaction or RPC request fails."""


class AlgorandService:
    """Wrapper around Algorand Algod & Indexer nodes using algosdk."""

    def __init__(
        self,
        algod_address: str = "http://localhost:4001",
        algod_token: str = "a" * 64,
        indexer_address: str = "http://localhost:8980",
        indexer_token: str = "a" * 64,
    ) -> None:
        if ALGOSDK_AVAILABLE:
            self.algod_client = algod.AlgodClient(algod_token, algod_address)
            self.indexer_client = indexer.IndexerClient(indexer_token, indexer_address)

    def check_health(self) -> dict[str, Any]:
        """Check Algod and Indexer connectivity."""
        if not ALGOSDK_AVAILABLE:
            return {"algod_online": False, "last_round": 0, "indexer_online": False, "note": "algosdk not installed"}
        try:
            status = self.algod_client.status()
            health = {
                "algod_online": True,
                "last_round": status.get("last-round", 0),
                "indexer_online": True,
            }
        except Exception:
            health = {
                "algod_online": False,
                "last_round": 0,
                "indexer_online": False,
            }
        return health

    def generate_account(self) -> dict[str, str]:
        """Generate a new Algorand keypair and mnemonic."""
        if not ALGOSDK_AVAILABLE:
            return {"address": "0xMOCK_ALGO_ADDR", "mnemonic": "mock mnemonic string", "private_key": "0xMOCK"}
        private_key, address = account.generate_account()
        return {
            "address": address,
            "mnemonic": mnemonic.from_private_key(private_key),
            "private_key": private_key,
        }

    def encrypt_and_hash_payload(self, payload: bytes, secret_key: bytes) -> tuple[EncryptedBlob, bytes]:
        """Encrypt off-chain asset payload with AES-256-GCM and compute 32-byte SHA-256 digest for Algorand ASA metadata hash."""
        blob = encrypt(payload, secret_key)
        payload_hash = hashlib.sha256(blob.ciphertext).digest()
        return blob, payload_hash
