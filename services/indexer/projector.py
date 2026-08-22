"""Canonical event projection primitives for the staged indexer.

This module is dependency-free and intentionally uses an in-memory store for
local tests. A production adapter must persist the same keys transactionally
in PostgreSQL and obtain canonical blocks/events from an approved RPC provider.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EventKey:
    chain_id: int
    contract_address: str
    transaction_hash: str
    log_index: int
    event_version: int = 1


@dataclass(frozen=True)
class CanonicalEvent:
    key: EventKey
    block_number: int
    block_hash: str
    name: str
    payload: tuple[tuple[str, str], ...] = ()


class ProjectionConflict(ValueError):
    """Raised when one event or block identity is associated with different content."""


class BlockGap(ValueError):
    """Raised when a scan checkpoint skips an unprocessed block."""


class InMemoryProjection:
    """Local reference projector; production use requires durable transactions."""

    def __init__(self) -> None:
        self._events: dict[EventKey, CanonicalEvent] = {}
        self._blocks: dict[int, str] = {}
        self._last_processed_block: int | None = None

    @property
    def last_processed_block(self) -> int | None:
        return self._last_processed_block

    @property
    def events(self) -> tuple[CanonicalEvent, ...]:
        return tuple(sorted(self._events.values(), key=lambda event: (event.block_number, event.key.log_index)))

    def checkpoint(self, block_number: int, block_hash: str, *, allow_gap: bool = False) -> bool:
        """Record a scanned canonical block, including blocks with no events."""
        if block_number < 0 or not block_hash:
            raise ValueError("block number and hash must be valid")
        known = self._blocks.get(block_number)
        if known:
            if known != block_hash:
                raise ProjectionConflict("a block number was observed with multiple block hashes")
            return False
        if self._last_processed_block is not None and block_number > self._last_processed_block + 1 and not allow_gap:
            raise BlockGap(f"expected block {self._last_processed_block + 1}, received {block_number}")
        self._blocks[block_number] = block_hash
        if self._last_processed_block is None or block_number > self._last_processed_block:
            self._last_processed_block = block_number
        return True

    def ingest(self, event: CanonicalEvent) -> bool:
        """Project one event; its block must already be checkpointed or be checkpointed by the caller."""
        if event.block_number < 0 or event.key.log_index < 0 or not event.block_hash:
            raise ValueError("event block number, block hash, and log index must be valid")
        known = self._events.get(event.key)
        if known:
            if known != event:
                raise ProjectionConflict("event identity was reused for different event content")
            return False
        known_block_hash = self._blocks.get(event.block_number)
        if known_block_hash and known_block_hash != event.block_hash:
            raise ProjectionConflict("event block hash disagrees with the canonical checkpoint")
        self._events[event.key] = event
        return True

    def rollback_from(self, block_number: int) -> int:
        if block_number < 0:
            raise ValueError("rollback block must be non-negative")
        removed = [key for key, event in self._events.items() if event.block_number >= block_number]
        for key in removed:
            del self._events[key]
        for number in [number for number in self._blocks if number >= block_number]:
            del self._blocks[number]
        self._last_processed_block = max(self._blocks, default=None)
        return len(removed)

    def verify_contiguous_blocks(self) -> None:
        if not self._blocks:
            return
        numbers = sorted(self._blocks)
        expected = list(range(numbers[0], numbers[-1] + 1))
        if numbers != expected:
            raise BlockGap(f"projection has a block gap between {numbers[0]} and {numbers[-1]}")

    def finalized_events(self, head_block: int, *, confirmations: int) -> tuple[CanonicalEvent, ...]:
        """Return only events with the explicitly requested canonical depth."""
        self._validate_confirmation_query(head_block, confirmations)
        return tuple(
            event for event in self.events
            if head_block - event.block_number >= confirmations
        )

    def unfinalized_events(self, head_block: int, *, confirmations: int) -> tuple[CanonicalEvent, ...]:
        """Return events that remain below the configured confirmation depth."""
        self._validate_confirmation_query(head_block, confirmations)
        return tuple(
            event for event in self.events
            if head_block - event.block_number < confirmations
        )

    @staticmethod
    def _validate_confirmation_query(head_block: int, confirmations: int) -> None:
        if head_block < 0 or confirmations < 0:
            raise ValueError("head block and confirmation depth must be non-negative")
