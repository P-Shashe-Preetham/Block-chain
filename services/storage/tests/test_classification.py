import unittest

from services.storage.classification import (
    MAX_PAYLOAD_BYTES,
    PayloadClass,
    PayloadDescriptor,
    PayloadRejected,
    authorize_payload,
)


def descriptor(**overrides):
    values = {
        "object_id": "asset-7-v1",
        "payload_class": PayloadClass.ENCRYPTED_ASSET_CIPHERTEXT,
        "size_bytes": 1024,
        "content_type": "application/octet-stream",
        "encrypted": True,
    }
    values.update(overrides)
    return PayloadDescriptor(**values)


class PayloadClassificationTests(unittest.TestCase):
    def test_permitted_prototype_categories_pass(self):
        authorize_payload(descriptor())
        authorize_payload(descriptor(payload_class=PayloadClass.PUBLIC_METADATA, encrypted=False))

    def test_sensitive_and_unknown_categories_fail_closed(self):
        for payload_class in (
            PayloadClass.IDENTITY_DOCUMENT,
            PayloadClass.BIOMETRIC,
            PayloadClass.SECRET,
            PayloadClass.REGULATED,
            PayloadClass.UNKNOWN,
        ):
            with self.subTest(payload_class=payload_class), self.assertRaises(PayloadRejected):
                authorize_payload(descriptor(payload_class=payload_class))

    def test_ciphertext_must_be_declared_encrypted(self):
        with self.assertRaises(PayloadRejected):
            authorize_payload(descriptor(encrypted=False))

    def test_size_and_required_metadata_are_bounded(self):
        with self.assertRaises(PayloadRejected):
            authorize_payload(descriptor(size_bytes=MAX_PAYLOAD_BYTES + 1))
        with self.assertRaises(PayloadRejected):
            authorize_payload(descriptor(object_id=""))
        with self.assertRaises(PayloadRejected):
            authorize_payload(descriptor(content_type=""))

    def test_public_metadata_cannot_claim_sensitive_approval(self):
        with self.assertRaises(PayloadRejected):
            authorize_payload(descriptor(payload_class=PayloadClass.PUBLIC_METADATA, encrypted=False, classification_owner_approved=True))


if __name__ == "__main__":
    unittest.main()
