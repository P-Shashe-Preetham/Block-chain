"""Initial durable workflow and projection schema.

Revision ID: 0001_initial_projection_schema
Revises:
Create Date: 2026-08-23
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_initial_projection_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "transaction_intents",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("subject_key", sa.String(length=128), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("request_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("transaction_hash", sa.String(length=66), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("subject_key", "idempotency_key", name="uq_transaction_subject_idempotency"),
    )
    op.create_table(
        "canonical_events",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("chain_id", sa.Integer(), nullable=False),
        sa.Column("contract_address", sa.String(length=42), nullable=False),
        sa.Column("transaction_hash", sa.String(length=66), nullable=False),
        sa.Column("log_index", sa.Integer(), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False),
        sa.Column("block_number", sa.Integer(), nullable=False),
        sa.Column("block_hash", sa.String(length=66), nullable=False),
        sa.Column("event_name", sa.String(length=128), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("projection_status", sa.String(length=32), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "chain_id", "contract_address", "transaction_hash", "log_index", "event_version",
            name="uq_canonical_event_identity",
        ),
    )
    op.create_table(
        "block_checkpoints",
        sa.Column("chain_id", sa.Integer(), nullable=False),
        sa.Column("block_number", sa.Integer(), nullable=False),
        sa.Column("block_hash", sa.String(length=66), nullable=False),
        sa.Column("finalized", sa.Boolean(), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("chain_id", "block_number"),
    )
    op.create_table(
        "reconciliation_findings",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("subject_key", sa.String(length=256), nullable=False),
        sa.Column("finding_kind", sa.String(length=32), nullable=False),
        sa.Column("canonical_value", sa.Text(), nullable=True),
        sa.Column("projected_value", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    raise RuntimeError("Destructive downgrades are prohibited; use an approved forward migration or restore-and-reconcile procedure")
