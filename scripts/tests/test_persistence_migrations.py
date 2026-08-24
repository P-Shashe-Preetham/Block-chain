from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


ROOT = Path(__file__).resolve().parents[2]


class PersistenceMigrationTests(unittest.TestCase):
    def test_initial_revision_upgrades_a_disposable_database(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / "migration.sqlite3"
            previous = os.environ.get("DATABASE_URL")
            os.environ["DATABASE_URL"] = f"sqlite:///{database_path}"
            try:
                config = Config(str(ROOT / "services/persistence/alembic.ini"))
                config.set_main_option("script_location", str(ROOT / "services/persistence/alembic"))
                command.upgrade(config, "head")
            finally:
                if previous is None:
                    os.environ.pop("DATABASE_URL", None)
                else:
                    os.environ["DATABASE_URL"] = previous

            engine = create_engine(f"sqlite:///{database_path}")
            inspector = inspect(engine)
            tables = set(inspector.get_table_names())
            transaction_constraints = {item["name"] for item in inspector.get_check_constraints("transaction_intents")}
            event_constraints = {item["name"] for item in inspector.get_check_constraints("canonical_events")}
        self.assertTrue({
            "alembic_version",
            "transaction_intents",
            "canonical_events",
            "raw_chain_logs",
            "block_checkpoints",
            "reconciliation_findings",
        }.issubset(tables))
        self.assertIn("ck_transaction_intent_status", transaction_constraints)
        self.assertIn("ck_canonical_event_projection_status", event_constraints)


if __name__ == "__main__":
    unittest.main()
