from __future__ import annotations

import unittest

from services.persistence.database import DatabaseConfigurationError, DatabaseSettings, create_database_engine


class DatabaseSettingsTests(unittest.TestCase):
    def test_local_sqlite_is_allowed_for_disposable_tests(self) -> None:
        settings = DatabaseSettings("local", "sqlite+pysqlite:///:memory:", "disable")
        engine = create_database_engine(settings)
        self.assertTrue(engine.dialect.name == "sqlite")

    def test_sqlite_is_rejected_outside_disposable_environments(self) -> None:
        with self.assertRaises(DatabaseConfigurationError):
            create_database_engine(DatabaseSettings("production", "sqlite+pysqlite:///:memory:"))

    def test_non_local_postgresql_requires_secure_ssl_mode(self) -> None:
        with self.assertRaises(DatabaseConfigurationError):
            create_database_engine(DatabaseSettings("pilot", "postgresql+psycopg://user:pass@db.example/app", "disable"))
        engine = create_database_engine(DatabaseSettings("pilot", "postgresql+psycopg://user:pass@db.example/app", "require"))
        self.assertEqual(engine.dialect.name, "postgresql")

    def test_pinned_postgresql_driver_constructs_lazily_without_network_access(self) -> None:
        engine = create_database_engine(
            DatabaseSettings(
                "development",
                "postgresql+psycopg://user:pass@db.example/app",
                "require",
            )
        )
        self.assertEqual(engine.dialect.name, "postgresql")
        self.assertEqual(engine.url.drivername, "postgresql+psycopg")
        self.assertTrue(engine.hide_parameters)

    def test_invalid_scheme_and_missing_url_fail_closed(self) -> None:
        with self.assertRaises(DatabaseConfigurationError):
            create_database_engine(DatabaseSettings("local", "mysql://user:pass@db.example/app", "disable"))
        with self.assertRaises(DatabaseConfigurationError):
            create_database_engine(DatabaseSettings("local", "", "disable"))


if __name__ == "__main__":
    unittest.main()
