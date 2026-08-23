"""Reference policy for KMS/HSM key release authorization.

This module returns authorization metadata only. It never contains, derives, or
returns a data-encryption key. A production adapter must perform the final
release inside an approved KMS/HSM with independent IAM and audit controls.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum


class KeyStatus(StrEnum):
    ACTIVE = "active"
    RETIRED = "retired"
    REVOKED = "revoked"
    DESTROYED = "destroyed"


class KeyReleaseDenied(PermissionError):
    """Raised whenever release prerequisites are missing or stale."""


@dataclass(frozen=True)
class KeyReference:
    key_id: str
    version: int
    purpose: str


@dataclass(frozen=True)
class AccessDecisionEvidence:
    asset_id: int
    action: str
    subject_key: str
    decision: str
    decision_block: int
    expires_at: datetime | None


@dataclass(frozen=True)
class KeyReleaseRequest:
    reference: KeyReference
    asset_id: int
    action: str
    subject_key: str
    requester_active: bool
    key_status: KeyStatus
    audit_request_id: str


@dataclass(frozen=True)
class KeyReleaseAuthorization:
    """Non-secret authorization result passed to a separately controlled KMS adapter."""

    reference: KeyReference
    asset_id: int
    action: str
    subject_key: str
    evidence_block: int
    audit_request_id: str


def authorize_key_release(
    request: KeyReleaseRequest,
    evidence: AccessDecisionEvidence,
    *,
    now: datetime | None = None,
) -> KeyReleaseAuthorization:
    _validate_request(request)
    _validate_evidence(evidence)
    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        raise KeyReleaseDenied("release time must be timezone-aware")
    if not request.requester_active:
        raise KeyReleaseDenied("inactive requester cannot release a key")
    if request.key_status is not KeyStatus.ACTIVE:
        raise KeyReleaseDenied("key is not active")
    if evidence.decision != "GRANTED":
        raise KeyReleaseDenied("canonical access decision did not grant release")
    if evidence.asset_id != request.asset_id or evidence.action != request.action or evidence.subject_key != request.subject_key:
        raise KeyReleaseDenied("access evidence does not match the release request")
    if evidence.expires_at is not None:
        if evidence.expires_at.tzinfo is None or current_time >= evidence.expires_at:
            raise KeyReleaseDenied("access evidence is expired")
    return KeyReleaseAuthorization(
        reference=request.reference,
        asset_id=request.asset_id,
        action=request.action,
        subject_key=request.subject_key,
        evidence_block=evidence.decision_block,
        audit_request_id=request.audit_request_id,
    )


def _validate_request(request: KeyReleaseRequest) -> None:
    if not isinstance(request, KeyReleaseRequest):
        raise KeyReleaseDenied("invalid key release request")
    if not request.reference.key_id or not request.reference.purpose or request.reference.version < 1:
        raise KeyReleaseDenied("invalid key reference")
    if request.asset_id < 1 or not request.action or not request.subject_key or not request.audit_request_id:
        raise KeyReleaseDenied("release request is incomplete")


def _validate_evidence(evidence: AccessDecisionEvidence) -> None:
    if not isinstance(evidence, AccessDecisionEvidence):
        raise KeyReleaseDenied("invalid access evidence")
    if evidence.asset_id < 1 or not evidence.action or not evidence.subject_key or evidence.decision_block < 1:
        raise KeyReleaseDenied("access evidence is incomplete")
