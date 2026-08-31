"""
Asymmetric JWT Access Token Service for Open Banking Cryptographic Authorization.
Implements ES256 (ECDSA P-256) signature generation and verification.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from typing import Any, Dict, Optional, Tuple

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

logger = logging.getLogger(__name__)


class JWTService:
    def __init__(self) -> None:
        self.issuer = "open-banking-access-manager"
        self.algorithm = "ES256"
        self._init_keys()

    def _init_keys(self) -> None:
        app_env = os.getenv("APP_ENV", "local").strip().lower()
        private_pem_env = os.getenv("JWT_PRIVATE_KEY_PEM")
        public_pem_env = os.getenv("JWT_PUBLIC_KEY_PEM")

        if private_pem_env:
            self._private_key = serialization.load_pem_private_key(
                private_pem_env.encode("utf-8"), password=None, backend=default_backend()
            )
            if public_pem_env:
                self._public_key = serialization.load_pem_public_key(
                    public_pem_env.encode("utf-8"), backend=default_backend()
                )
            else:
                self._public_key = self._private_key.public_key()
            logger.info("Loaded JWT ES256 keys from environment configuration.")
        else:
            if app_env in {"pilot", "production"}:
                raise RuntimeError("FATAL: JWT_PRIVATE_KEY_PEM must be explicitly configured in pilot/production")
            # Generate deterministic or runtime ephemeral keypair for local/CI development
            logger.warning("Generating ephemeral ES256 keypair for local environment.")
            self._private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
            self._public_key = self._private_key.public_key()

        self._private_pem = self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

        self._public_pem = self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

    def create_token(
        self,
        user_wallet: str,
        bank_wallet: str,
        tsp_wallet: str,
        data_type: str,
        consent_id: str,
        ttl_seconds: int = 900,
    ) -> str:
        """Create a signed ES256 JWT authorization token."""
        now = int(time.time())
        payload = {
            "iss": self.issuer,
            "sub": user_wallet.lower(),
            "aud": bank_wallet.lower(),
            "bank_wallet": bank_wallet.lower(),
            "tsp_wallet": tsp_wallet.lower(),
            "data_type": data_type.upper(),
            "scope": data_type.upper(),
            "consent_id": consent_id,
            "iat": now,
            "nbf": now,
            "exp": now + ttl_seconds,
            "jti": uuid.uuid4().hex,
        }

        token = jwt.encode(payload, self._private_pem, algorithm=self.algorithm)
        return token

    def verify_token(
        self,
        token: str,
        expected_audience: Optional[str] = None,
    ) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """Verify the signature and claims of an ES256 JWT token."""
        if not token:
            return False, None, "Missing token"

        try:
            decode_options = {
                "require": ["exp", "iat", "sub", "iss"],
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_iss": True,
            }

            decode_kwargs: Dict[str, Any] = {
                "algorithms": [self.algorithm],
                "issuer": self.issuer,
                "options": decode_options,
            }

            if expected_audience:
                decode_kwargs["audience"] = expected_audience.lower()
            else:
                decode_options["verify_aud"] = False

            payload = jwt.decode(
                token,
                self._public_pem,
                **decode_kwargs,
            )
            return True, payload, "Token valid"

        except jwt.ExpiredSignatureError:
            return False, None, "JWT token has expired"
        except jwt.InvalidAudienceError:
            return False, None, "JWT audience does not match the target bank"
        except jwt.InvalidIssuerError:
            return False, None, "JWT issuer is invalid"
        except jwt.InvalidSignatureError:
            return False, None, "Invalid JWT signature"
        except jwt.PyJWTError as exc:
            return False, None, f"JWT verification failed: {str(exc)}"
        except Exception as exc:
            return False, None, f"Unexpected token decoding error: {str(exc)}"

    def get_public_pem(self) -> str:
        """Return the public key in PEM format for external verification."""
        return self._public_pem


jwt_service = JWTService()