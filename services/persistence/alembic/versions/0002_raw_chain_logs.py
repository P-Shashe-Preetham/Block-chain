"""Add raw chain-log retention for decoder integrity review.

Revision ID: 0002_raw_chain_logs
Revises: 0001_initial_projection_schema
Create Date: 2026-08-23
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002_raw_chain_logs"
down_revision = "0001_initial_projection_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "raw_chain_logs",
        sa.Column("event_id", sa.String(length=160), nullable=False),
        sa.Column("chain_id", sa.Integer(), nullable=False),
        sa.Column("contract_address", sa.String(length=42), nullable=False),
        sa.Column("transaction_hash", sa.String(length=66), nullable=False),
        sa.Column("log_index", sa.Integer(), nullable=False),
        sa.Column("block_number", sa.Integer(), nullable=False),
        sa.Column("block_hash", sa.String(length=66), nullable=False),
        sa.Column("topics_json", sa.Text(), nullable=False),
        sa.Column("data_hex", sa.Text(), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )


def downgrade() -> None:
    raise RuntimeError("Destructive downgrades are prohibited; use an approved forward migration or restore-and-reconcile procedure")
