"""Prototype payload-classification policy for the storage boundary.

This is a declared-metadata policy gate, not a DLP, malware scanner, or legal
classification service. Unknown or sensitive classes are rejected until an
approved classifier and data owner decision exists.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


MAX_PAYLOAD_BYTES = 25 * 1024 * 1024


class PayloadClass(StrEnum):
    PUBLIC_METADATA = "public_metadata"
    ENCRYPTED_ASSET_CIPHERTEXT = "encrypted_asset_ciphertext"
    IDENTITY_DOCUMENT = "identity_document"
    BIOMETRIC = "biometric"
    SECRET = "secret"
    REGULATED = "regulated"
    UNKNOWN = "unknown"


class PayloadRejected(ValueError):
    """Raised when a payload is not permitted by the prototype policy."""


@dataclass(frozen=True)
class PayloadDescriptor:
    object_id: str
    payload_class: PayloadClass
    size_bytes: int
    content_type: str
    encrypted: bool
    classification_owner_approved: bool = False


def authorize_payload(descriptor: PayloadDescriptor) -> None:
    """Validate declared metadata before an eventual storage adapter accepts bytes."""
    if not isinstance(descriptor, PayloadDescriptor):
        raise PayloadRejected("payload descriptor is invalid")
    if not descriptor.object_id or not descriptor.content_type or descriptor.size_bytes < 0:
        raise PayloadRejected("payload descriptor is incomplete")
    if descriptor.size_bytes > MAX_PAYLOAD_BYTES:
        raise PayloadRejected("payload exceeds the prototype size limit")
    if descriptor.payload_class in {
        PayloadClass.IDENTITY_DOCUMENT,
        PayloadClass.BIOMETRIC,
        PayloadClass.SECRET,
        PayloadClass.REGULATED,
        PayloadClass.UNKNOWN,
    }:
        raise PayloadRejected("payload class is not permitted")
    if descriptor.payload_class is PayloadClass.ENCRYPTED_ASSET_CIPHERTEXT and not descriptor.encrypted:
        raise PayloadRejected("asset ciphertext must be declared encrypted")
    if descriptor.payload_class is PayloadClass.PUBLIC_METADATA and descriptor.classification_owner_approved:
        raise PayloadRejected("public metadata cannot use an unreviewed sensitive-data approval flag")
