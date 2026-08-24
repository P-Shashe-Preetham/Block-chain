from datetime import datetime, timedelta, timezone
import unittest

from services.storage.key_release import (
    AccessDecisionEvidence,
    KeyReference,
    KeyReleaseDenied,
    KeyReleaseRequest,
    KeyStatus,
    authorize_key_release,
)


NOW = datetime(2026, 8, 23, 12, 0, tzinfo=timezone.utc)


def request(**overrides):
    value = KeyReleaseRequest(
        reference=KeyReference("asset-key-7", 2, "asset-content"),
        asset_id=7,
        action="READ",
        subject_key="did:key:z6MkSubject",
        requester_active=True,
        key_status=KeyStatus.ACTIVE,
        audit_request_id="req-123",
    )
    return value.__class__(**{**value.__dict__, **overrides})


def evidence(**overrides):
    value = AccessDecisionEvidence(
        asset_id=7,
        action="READ",
        subject_key="did:key:z6MkSubject",
        decision="GRANTED",
        decision_block=101,
        expires_at=NOW + timedelta(minutes=5),
    )
    return value.__class__(**{**value.__dict__, **overrides})


class KeyReleasePolicyTests(unittest.TestCase):
    def test_grant_returns_non_secret_authorization_metadata(self):
        result = authorize_key_release(request(), evidence(), now=NOW)
        self.assertEqual(result.reference.key_id, "asset-key-7")
        self.assertEqual(result.evidence_block, 101)
        self.assertFalse(hasattr(result, "key"))

    def test_denies_non_granted_decision(self):
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(), evidence(decision="DENIED"), now=NOW)

    def test_denies_expired_evidence(self):
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(), evidence(expires_at=NOW), now=NOW)

    def test_denies_mismatched_request(self):
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(action="WRITE"), evidence(), now=NOW)

    def test_denies_inactive_requester_and_non_active_key(self):
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(requester_active=False), evidence(), now=NOW)
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(key_status=KeyStatus.REVOKED), evidence(), now=NOW)

    def test_denies_naive_expiry_and_naive_now(self):
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(), evidence(expires_at=datetime(2026, 8, 23, 12, 5)), now=NOW)
        with self.assertRaises(KeyReleaseDenied):
            authorize_key_release(request(), evidence(), now=datetime(2026, 8, 23, 12, 0))


if __name__ == "__main__":
    unittest.main()
