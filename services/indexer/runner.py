"""Atomic one-shot indexer execution boundary.

This runner is deliberately synchronous and bounded. An approved scheduler or
worker may call it later, but this module does not create a daemon, queue,
backfill policy, operator repair command, or authorization decision.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from .consumer import JsonRpcClient, PersistentConfirmedScanner, ScanResult


class PersistentConfirmedScanOnce:
    """Run one confirmed-range scan in one transaction and commit atomically."""

    def __init__(
        self,
        client: JsonRpcClient,
        *,
        chain_id: int,
        contract_address: str,
        confirmations: int,
        session_factory: Callable[[], Session],
    ) -> None:
        self._client = client
        self._chain_id = chain_id
        self._contract_address = contract_address
        self._confirmations = confirmations
        self._session_factory = session_factory

    def run(self, start_block: int) -> ScanResult:
        session = self._session_factory()
        try:
            with session.begin():
                scanner = PersistentConfirmedScanner(
                    self._client,
                    chain_id=self._chain_id,
                    contract_address=self._contract_address,
                    session=session,
                    confirmations=self._confirmations,
                )
                return scanner.scan(start_block)
        finally:
            session.close()
