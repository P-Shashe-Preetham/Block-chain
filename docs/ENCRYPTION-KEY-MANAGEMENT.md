# Encryption and Key Management

## Scope

This document defines the prototype handling boundary for sensitive digital-asset payloads. It does not claim that the repository currently contains an IPFS gateway, KMS, HSM, or enterprise key-custody integration.

## Prototype workflow

1. The client or approved service classifies the payload and rejects raw identity documents or unapproved sensitive data.
2. The service generates a fresh random 256-bit data-encryption key for the payload.
3. The payload is encrypted with an authenticated AES-256 mode such as AES-256-GCM. The nonce, authentication tag, version, and algorithm identifier are stored as non-secret metadata.
4. The encrypted payload is uploaded to IPFS or approved object storage. If IPFS is used, the resulting CID references encrypted bytes and is not itself a confidentiality mechanism.
5. The contract records only the approved asset ID and a fixed-size metadata/content hash. No plaintext, private key, or raw data-encryption key is written on-chain.
6. An access request is submitted to the application/contract policy. A successful decision does not automatically expose a decryption key.
7. The service authorizes the requester, unwraps or re-encrypts the data key for the approved recipient, and records the operation metadata without logging the key or plaintext.

## Key lifecycle

| Lifecycle stage | Required control |
|---|---|
| Generation | Cryptographically secure random generation; never derive keys from user names, asset IDs, or predictable timestamps |
| Wrapping | Use a separately protected wrapping key or approved KMS envelope-encryption mechanism |
| Distribution | Release only after identity, role, asset, and access-decision checks; use short-lived delivery where possible |
| Rotation | Rotate wrapping keys and re-wrap data keys; re-encrypt payloads when policy or cryptographic standards require it |
| Revocation | Stop future key release and revoke application grants; recognize that immutable CIDs and previously downloaded plaintext cannot be erased by blockchain state |
| Recovery | Maintain approved backup and recovery procedures without exporting raw keys into application logs or source control |
| Destruction | Destroy or retire wrapping material according to retention and legal policy; document limits for copies and immutable references |

## Production extension

A production deployment should integrate an enterprise KMS or HSM with multi-party administration, audit logging, role separation, key rotation, recovery, and data-residency controls. The MVP uses software-safe test fixtures only and must never use production keys, real identity data, or unapproved BEL payloads.

## Security limitations

Blockchain authorization can govern whether a service should release a key, but it cannot guarantee that an authorized recipient will not copy or redistribute decrypted data. Production environments may require endpoint protection, DLP, watermarking, controlled viewers, or other organizational controls. Encryption also does not make a public CID private; the payload must be encrypted before publication.

## References

[1]: https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final "NIST SP 800-57 Part 1: Key Management Recommendations"
[2]: https://csrc.nist.gov/publications/detail/sp/800-38d/final "NIST SP 800-38D: Galois/Counter Mode"
[3]: https://ipfs.tech/ "IPFS documentation and project site"
[4]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
