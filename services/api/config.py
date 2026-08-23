"""Validated service configuration for the API boundary."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlparse


class ConfigurationError(RuntimeError):
    """Raised when the service cannot safely start or authenticate requests."""


@dataclass(frozen=True)
class Settings:
    app_env: str
    auth_issuer: str | None
    auth_audience: str | None
    auth_jwks_url: str | None
    chain_id: int
    rpc_url: str
    contract_address: str | None
    cors_allowed_origins: tuple[str, ...]
    database_url: str | None = None
    database_ssl_mode: str = "require"

    @classmethod
    def from_env(cls) -> "Settings":
        app_env = os.getenv("APP_ENV", "local").strip().lower()
        if app_env not in {"local", "ci", "development", "testnet", "pilot", "production"}:
            raise ConfigurationError("APP_ENV must be local, ci, development, testnet, pilot, or production")

        chain_id_raw = os.getenv("CHAIN_ID", "31337")
        try:
            chain_id = int(chain_id_raw)
        except ValueError as exc:
            raise ConfigurationError("CHAIN_ID must be an integer") from exc
        if chain_id <= 0:
            raise ConfigurationError("CHAIN_ID must be positive")

        rpc_url = os.getenv("RPC_URL", "http://127.0.0.1:8545").strip()
        parsed_rpc = urlparse(rpc_url)
        if parsed_rpc.scheme not in {"http", "https"} or not parsed_rpc.netloc:
            raise ConfigurationError("RPC_URL must be an HTTP(S) URL with a host")
        if app_env in {"testnet", "pilot", "production"} and parsed_rpc.scheme != "https":
            raise ConfigurationError("RPC_URL must use HTTPS outside local/CI")

        contract_address = os.getenv("CONTRACT_ADDRESS", "").strip() or None
        if contract_address and (len(contract_address) != 42 or not contract_address.startswith("0x")):
            raise ConfigurationError("CONTRACT_ADDRESS must be a 20-byte 0x-prefixed address")
        if app_env in {"testnet", "pilot", "production"} and not contract_address:
            raise ConfigurationError("CONTRACT_ADDRESS is required outside local/CI")

        auth_issuer = os.getenv("AUTH_ISSUER", "").strip() or None
        auth_audience = os.getenv("AUTH_AUDIENCE", "").strip() or None
        auth_jwks_url = os.getenv("AUTH_JWKS_URL", "").strip() or None
        if app_env in {"testnet", "pilot", "production"}:
            if not auth_issuer or not auth_audience or not auth_jwks_url:
                raise ConfigurationError("AUTH_ISSUER, AUTH_AUDIENCE, and AUTH_JWKS_URL are required outside local/CI")
            parsed_jwks = urlparse(auth_jwks_url)
            if parsed_jwks.scheme != "https" or not parsed_jwks.netloc:
                raise ConfigurationError("AUTH_JWKS_URL must use HTTPS outside local/CI")

        origins = tuple(
            origin.strip()
            for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
            if origin.strip()
        )
        if not origins:
            raise ConfigurationError("CORS_ALLOWED_ORIGINS must contain at least one origin")
        if app_env in {"testnet", "pilot", "production"} and "*" in origins:
            raise ConfigurationError("wildcard CORS is forbidden outside local/CI")

        database_url = os.getenv("DATABASE_URL", "").strip() or None
        database_ssl_mode = os.getenv("DATABASE_SSL_MODE", "require").strip().lower()
        if database_ssl_mode not in {"disable", "require", "verify-ca", "verify-full"}:
            raise ConfigurationError("DATABASE_SSL_MODE is invalid")
        if app_env in {"pilot", "production"} and not database_url:
            raise ConfigurationError("DATABASE_URL is required for pilot and production")
        if database_url:
            parsed_database = urlparse(database_url)
            if parsed_database.scheme not in {"postgresql", "postgresql+psycopg", "sqlite", "sqlite+pysqlite"}:
                raise ConfigurationError("DATABASE_URL must use PostgreSQL or an explicitly local SQLite scheme")
            if parsed_database.scheme.startswith("sqlite") and app_env not in {"local", "ci", "development"}:
                raise ConfigurationError("SQLite is forbidden outside local, CI, and development")
            if parsed_database.scheme.startswith("postgresql") and app_env in {"pilot", "production"} and database_ssl_mode not in {"require", "verify-ca", "verify-full"}:
                raise ConfigurationError("secure PostgreSQL SSL mode is required outside local/CI")

        return cls(
            app_env=app_env,
            auth_issuer=auth_issuer,
            auth_audience=auth_audience,
            auth_jwks_url=auth_jwks_url,
            chain_id=chain_id,
            rpc_url=rpc_url,
            contract_address=contract_address,
            cors_allowed_origins=origins,
            database_url=database_url,
            database_ssl_mode=database_ssl_mode,
        )
