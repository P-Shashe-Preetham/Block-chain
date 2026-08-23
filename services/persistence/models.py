"""Durable-service schema primitives for the future PostgreSQL adapter.

These models are not yet wired to API routes or an indexer worker. Contract
facts remain canonical, and migrations, tenant isolation, key custody, and
operational backup/restore are still required before non-local use.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TransactionIntent(Base):
    __tablename__ = "transaction_intents"
    __table_args__ = (
        UniqueConstraint("subject_key", "idempotency_key", name="uq_transaction_subject_idempotency"),
        CheckConstraint(
            "status IN ('requested', 'signed', 'submitted', 'pending', 'confirmed', 'failed', 'reverted', 'replaced', 'unknown')",
            name="ck_transaction_intent_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    subject_key: Mapped[str] = mapped_column(String(128), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    request_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    transaction_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CanonicalEventRecord(Base):
    __tablename__ = "canonical_events"
    __table_args__ = (
        UniqueConstraint(
            "chain_id", "contract_address", "transaction_hash", "log_index", "event_version",
            name="uq_canonical_event_identity",
        ),
        CheckConstraint(
            "projection_status IN ('canonical', 'unfinalized', 'uncertain')",
            name="ck_canonical_event_projection_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    chain_id: Mapped[int] = mapped_column(Integer, nullable=False)
    contract_address: Mapped[str] = mapped_column(String(42), nullable=False)
    transaction_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    log_index: Mapped[int] = mapped_column(Integer, nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    block_number: Mapped[int] = mapped_column(Integer, nullable=False)
    block_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    event_name: Mapped[str] = mapped_column(String(128), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    projection_status: Mapped[str] = mapped_column(String(32), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class RawChainLogRecord(Base):
    __tablename__ = "raw_chain_logs"

    event_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    chain_id: Mapped[int] = mapped_column(Integer, nullable=False)
    contract_address: Mapped[str] = mapped_column(String(42), nullable=False)
    transaction_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    log_index: Mapped[int] = mapped_column(Integer, nullable=False)
    block_number: Mapped[int] = mapped_column(Integer, nullable=False)
    block_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    topics_json: Mapped[str] = mapped_column(Text, nullable=False)
    data_hex: Mapped[str] = mapped_column(Text, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class BlockCheckpoint(Base):
    __tablename__ = "block_checkpoints"

    chain_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    block_number: Mapped[int] = mapped_column(Integer, primary_key=True)
    block_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    finalized: Mapped[bool] = mapped_column(nullable=False, default=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ReconciliationFinding(Base):
    __tablename__ = "reconciliation_findings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    subject_key: Mapped[str] = mapped_column(String(256), nullable=False)
    finding_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    canonical_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    projected_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
