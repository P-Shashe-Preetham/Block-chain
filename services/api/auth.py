"""Authentication boundary for the API.

The service intentionally fails closed until an approved OIDC/JWKS verifier is
configured. It never treats a wallet address, unsigned header, or decoded-but
unverified JWT payload as an authenticated principal.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from fastapi import Header, HTTPException, status

from .config import ConfigurationError, Settings


@dataclass(frozen=True)
class Principal:
    subject: str
    roles: frozenset[str]
    scopes: frozenset[str]
    issuer: str
    audience: str


class TokenVerifier(Protocol):
    def verify(self, token: str) -> Principal:
        """Verify signature, issuer, audience, expiry, and required claims."""


class UnconfiguredTokenVerifier:
    """Safe default that refuses authentication when trust is not configured."""

    def verify(self, token: str) -> Principal:
        del token
        raise ConfigurationError("OIDC/JWKS token verification is not configured")


class OidcJwksTokenVerifier:
    """Integration boundary for the approved OIDC/JWKS provider.

    Network retrieval, JWKS caching, key rotation, algorithm allowlisting, and
    claim validation must be implemented with the organization's selected
    provider before testnet, pilot, or production use. Keeping this boundary
    explicit prevents an insecure ad-hoc JWT decoder from becoming a default.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def verify(self, token: str) -> Principal:
        del token
        raise ConfigurationError(
            "approved OIDC/JWKS verifier integration is required before authenticated API use"
        )


def build_verifier(settings: Settings) -> TokenVerifier:
    if settings.auth_issuer and settings.auth_audience and settings.auth_jwks_url:
        return OidcJwksTokenVerifier(settings)
    return UnconfiguredTokenVerifier()


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer authentication required")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer authentication required")
    return token.strip()


def require_principal(
    settings: Settings,
    authorization: str | None = Header(default=None),
) -> Principal:
    token = extract_bearer_token(authorization)
    try:
        return build_verifier(settings).verify(token)
    except ConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="authentication service is not configured",
        ) from exc
