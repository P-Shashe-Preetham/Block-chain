"""Fail-closed SQLAlchemy engine boundary for the staged persistence service."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

from sqlalchemy import Engine, create_engine


class DatabaseConfigurationError(RuntimeError):
    """Raised when a database URL is absent or unsafe for the selected stage."""


@dataclass(frozen=True)
class DatabaseSettings:
    app_env: str
    database_url: str
    database_ssl_mode: str = "require"

    def validate(self) -> None:
        if self.app_env not in {"local", "ci", "development", "testnet", "pilot", "production"}:
            raise DatabaseConfigurationError("unsupported application environment")
        if not self.database_url or any(ord(char) < 32 for char in self.database_url):
            raise DatabaseConfigurationError("database URL is required")
        parsed = urlparse(self.database_url)
        scheme = parsed.scheme.lower()
        if scheme not in {"postgresql", "postgresql+psycopg", "sqlite", "sqlite+pysqlite"}:
            raise DatabaseConfigurationError("database URL must use PostgreSQL or an explicitly local SQLite scheme")
        if scheme.startswith("sqlite"):
            if self.app_env not in {"local", "ci", "development"}:
                raise DatabaseConfigurationError("SQLite is forbidden outside local, CI, and development")
        else:
            if not parsed.hostname or not parsed.path:
                raise DatabaseConfigurationError("PostgreSQL URL must include a host and database name")
            if self.app_env in {"testnet", "pilot", "production"} and self.database_ssl_mode not in {"require", "verify-ca", "verify-full"}:
                raise DatabaseConfigurationError("secure PostgreSQL SSL mode is required outside local/CI")


def create_database_engine(settings: DatabaseSettings) -> Engine:
    settings.validate()
    connect_args: dict[str, str] = {}
    parsed = urlparse(settings.database_url)
    if parsed.scheme.startswith("postgresql") and settings.database_ssl_mode != "disable":
        connect_args["sslmode"] = settings.database_ssl_mode
    try:
        return create_engine(
            settings.database_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            hide_parameters=True,
        )
    except ModuleNotFoundError as error:
        raise DatabaseConfigurationError("configured PostgreSQL driver is not installed") from error
