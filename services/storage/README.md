# Encrypted-storage primitives

This directory contains a local reference envelope for authenticated encryption of permitted off-chain bytes. `services/storage/crypto.py` uses AES-256-GCM with a fresh 96-bit nonce, an explicit version/algorithm marker, and associated data that binds ciphertext to its application context.

The primitive does **not** implement object storage, access control, malware scanning, retention/deletion, key wrapping, KMS/HSM integration, key release, rotation, recovery, audit export, or availability guarantees. It does not accept real identity documents, credentials, biometric data, private keys, or organizational asset data. The key must be supplied by the caller and is never serialized into the envelope.

Before testnet or pilot use, an approved storage adapter must obtain data-encryption keys through managed custody, authenticate the storage object and metadata, bind tenant/asset/version context as associated data, enforce size and content policies, handle revocation and expiry, and record non-sensitive audit events. IPFS or object storage is not a confidentiality or deletion mechanism by itself.

Local validation from the repository root:

```bash
python3 -m pip install --require-hashes --requirement services/storage/requirements.lock
PYTHONPATH=. python3 -m unittest discover -s services/storage/tests -p 'test_*.py'
```
