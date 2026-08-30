"""
JWT Access Token Service for Open Banking Cryptographic Authorization
Generates and verifies short-lived JWT authorization tokens after blockchain access evaluation.
"""

import time
import base64
import hmac
import hashlib
import json
from typing import Dict, Any, Optional, Tuple

SECRET_KEY = "open_banking_super_secret_jwt_key_2026"

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64encode(data.encode('utf-8') + padding.encode('utf-8'))

class JWTService:
    def create_token(
        self, user_wallet: str, bank_wallet: str, tsp_wallet: str, data_type: str, consent_id: str, ttl_seconds: int = 900
    ) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        now = int(time.time())
        payload = {
            "iss": "open-banking-access-manager",
            "sub": user_wallet,
            "bank_wallet": bank_wallet,
            "tsp_wallet": tsp_wallet,
            "data_type": data_type,
            "consent_id": consent_id,
            "iat": now,
            "exp": now + ttl_seconds
        }

        header_b64 = _base64url_encode(json.dumps(header).encode('utf-8'))
        payload_b64 = _base64url_encode(json.dumps(payload).encode('utf-8'))

        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
        signature_b64 = _base64url_encode(signature)

        return f"{header_b64}.{payload_b64}.{signature_b64}"

    def verify_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        parts = token.split(".")
        if len(parts) != 3:
            return False, None, "Invalid JWT format"

        header_b64, payload_b64, signature_b64 = parts
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
        expected_sig_b64 = _base64url_encode(expected_sig)

        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return False, None, "Invalid JWT signature"

        try:
            padding = '=' * (4 - (len(payload_b64) % 4))
            raw_payload = base64.urlsafe_b64decode(payload_b64 + padding).decode('utf-8')
            payload = json.loads(raw_payload)
        except Exception as e:
            return False, None, f"Failed to parse payload: {str(e)}"

        now = int(time.time())
        if payload.get("exp", 0) < now:
            return False, payload, "JWT token has expired"

        return True, payload, "Token valid"

jwt_service = JWTService()
