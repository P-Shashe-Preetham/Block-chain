"""Algorand Indexer Consumer & Projection Sync.

Queries the Algorand Indexer REST API (/v2/transactions) for Application logs
and transaction note fields, parsing DID registrations, RBAC roles, and access
decisions into canonical relational database records.
"""

from __future__ import annotations

import base64
import logging
from typing import Any

from algosdk.v2client import indexer
from services.persistence.models import CanonicalEventRecord

logger = logging.getLogger(__name__)


from datetime import datetime, timezone

class AlgorandLogDecoder:
    """Decodes raw base64 transaction logs emitted by PyTeal smart contracts."""

    @staticmethod
    def decode_log(log_bytes_b64: str) -> dict[str, str] | None:
        """Decode base64 log into structured event data."""
        try:
            raw = base64.b64decode(log_bytes_b64).decode("utf-8", errors="ignore")
            if raw.startswith("ACCESS_DECISION:"):
                parts = raw.split(":")
                return {
                    "event_name": "AccessDecision",
                    "status": parts[1], # GRANTED / DENIED
                    "asset_id": parts[3] if len(parts) > 3 else "unknown",
                }
            elif raw.startswith("DID_REGISTERED:"):
                return {
                    "event_name": "DIDRegistered",
                    "subject_did": raw.split(":", 1)[1],
                }
            elif raw.startswith("ROLE_ASSIGNED:"):
                return {
                    "event_name": "RoleAssigned",
                    "account": raw.split(":", 1)[1],
                }
        except Exception:
            pass
        return None


class AlgorandIndexerConsumer:
    """Consumes transaction logs from Algorand Indexer API and returns projection models."""

    def __init__(self, indexer_client: indexer.IndexerClient | None = None) -> None:
        self.indexer_client = indexer_client or indexer.IndexerClient("a" * 64, "http://localhost:8980")

    def fetch_application_logs(self, app_id: int, min_round: int = 0) -> list[dict[str, Any]]:
        """Fetch logs emitted by an application on Algorand."""
        try:
            response = self.indexer_client.search_transactions(
                application_id=app_id,
                min_round=min_round,
            )
            return response.get("transactions", [])
        except Exception as error:
            logger.warning("Algorand Indexer connection offline, returning empty transaction set: %s", error)
            return []

    def parse_transaction_to_canonical_record(self, tx: dict[str, Any]) -> CanonicalEventRecord | None:
        """Convert an Algorand Indexer transaction object into a CanonicalEventRecord."""
        tx_id = tx.get("id", "ALGO_TX_UNKNOWN")
        block_round = tx.get("confirmed-round", 0)
        logs = tx.get("logs", [])

        decoded_event = None
        for raw_log in logs:
            decoded_event = AlgorandLogDecoder.decode_log(raw_log)
            if decoded_event:
                break

        if not decoded_event:
            return None

        contract_addr = f"app:{tx.get('application-transaction', {}).get('application-id', 0)}"
        return CanonicalEventRecord(
            id=f"4160-{contract_addr}-{tx_id}-0-1",
            chain_id=4160, # Algorand Mainnet/Testnet Genesis Chain Identifier
            contract_address=contract_addr,
            transaction_hash=tx_id,
            log_index=0,
            event_version=1,
            block_number=block_round,
            block_hash="0x" + "0" * 64,
            event_name=decoded_event["event_name"],
            payload_json=str(decoded_event),
            projection_status="canonical",
            observed_at=datetime.now(timezone.utc),
        )
