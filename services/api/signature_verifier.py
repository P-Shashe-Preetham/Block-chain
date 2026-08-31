"""
Cryptographic signature verification utility for Open Banking API boundaries.
Supports ECDSA personal_sign (EIP-191) and EIP-712 typed structured data.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from eth_account import Account
from eth_account.messages import encode_defunct, encode_typed_data
from fastapi import Header, HTTPException, status

logger = logging.getLogger(__name__)


def recover_personal_signature(message_text: str, signature_hex: str) -> Optional[str]:
    """Recover the Ethereum address that signed the message using ECDSA personal_sign."""
    if not signature_hex or not message_text:
        return None
    try:
        signable = encode_defunct(text=message_text)
        recovered_address = Account.recover_message(signable, signature=signature_hex)
        return recovered_address.lower()
    except Exception as exc:
        logger.debug("Personal signature recovery failed: %s", exc)
        return None


def verify_personal_signature(expected_wallet: str, message_text: str, signature_hex: str) -> bool:
    """Verify that expected_wallet matches the signer of message_text."""
    if not expected_wallet or not signature_hex or not message_text:
        return False
    recovered = recover_personal_signature(message_text, signature_hex)
    return recovered is not None and recovered == expected_wallet.lower()


def recover_eip712_signature(
    domain_data: Dict[str, Any],
    types_data: Dict[str, Any],
    message_data: Dict[str, Any],
    signature_hex: str,
) -> Optional[str]:
    """Recover the signer address from an EIP-712 typed data signature."""
    if not signature_hex:
        return None
    try:
        signable = encode_typed_data(
            domain_data=domain_data,
            message_types=types_data,
            message_data=message_data,
        )
        recovered_address = Account.recover_message(signable, signature=signature_hex)
        return recovered_address.lower()
    except Exception as exc:
        logger.debug("EIP-712 signature recovery failed: %s", exc)
        return None


def verify_eip712_signature(
    expected_wallet: str,
    domain_data: Dict[str, Any],
    types_data: Dict[str, Any],
    message_data: Dict[str, Any],
    signature_hex: str,
) -> bool:
    """Verify that expected_wallet matches the signer of EIP-712 typed data."""
    if not expected_wallet or not signature_hex:
        return False
    recovered = recover_eip712_signature(domain_data, types_data, message_data, signature_hex)
    return recovered is not None and recovered == expected_wallet.lower()


def require_wallet_signature(
    expected_wallet: str,
    canonical_action_message: str,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
) -> None:
    """FastAPI dependency / helper enforcing valid signature over action message."""
    if not x_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Signature header. Cryptographic proof of wallet ownership required.",
        )
    if not verify_personal_signature(expected_wallet, canonical_action_message, x_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cryptographic signature for the specified wallet address.",
        )