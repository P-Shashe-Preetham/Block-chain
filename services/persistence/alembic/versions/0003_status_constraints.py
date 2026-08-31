"""Add closed-set status constraints for durable workflow and projections.

Revision ID: 0003_status_constraints
Revises: 0002_raw_chain_logs
Create Date: 2026-08-23
"""

from __future__ import annotations

from alembic import op


revision = "0003_status_constraints"
down_revision = "0002_raw_chain_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("transaction_intents", recreate="always") as batch:
        batch.create_check_constraint(
            "ck_transaction_intent_status",
            "status IN ('requested', 'signed', 'submitted', 'pending', 'confirmed', 'failed', 'reverted', 'replaced', 'unknown')",
        )
    with op.batch_alter_table("canonical_events", recreate="always") as batch:
        batch.create_check_constraint(
            "ck_canonical_event_projection_status",
            "projection_status IN ('canonical', 'unfinalized', 'uncertain')",
        )


def downgrade() -> None:
    raise RuntimeError("Destructive downgrades are prohibited; use an approved forward migration or restore-and-reconcile procedure")
