# ADR 0006: Identity and credential adapter boundary

- **Status:** Accepted as a boundary; provider and DID method selection remain open
- **Date:** 2026-08-23
- **Decision owners:** Identity lead, security lead, privacy/legal owner, contract reviewer, backend lead, and organizational assurance owner
- **Review trigger:** Before implementing real OIDC/JWKS, DID resolution, credential verification, wallet login outside local fixtures, or any non-local API write

## Context

The contract stores a non-zero fixed-size DID-hash reference and uses EVM addresses for the MVP. This is not a complete DID method, DID document, resolver, credential system, employee-verification system, or organizational identity assurance process. The supplied SpruceID SSI, Sol DID, FIWARE Decentralized IAM, NFT Credential Management System, Heka Identity Platform, and WeIdentity sources provide relevant patterns, but none is an approval to select a provider, DID method, credential format, or organizational trust authority.

Accepting decoded JWT claims, unsigned wallet-address headers, a client role label, or a DID hash without verified provenance would create an authentication and authorization bypass. The final project therefore needs a replaceable adapter boundary that can be tested locally without pretending that local fixtures are production identity.

## Decision

Define a project-owned identity adapter interface with explicit operations for authentication, credential/presentation verification, subject mapping, key rotation, status, offboarding, and recovery. The adapter output must contain only minimized verified claims and an assurance context; raw identity documents, biometrics, credentials, private contact data, and bearer secrets must not cross into the contract, projection, logs, browser telemetry, or audit events.

The adapter must expose and test:

1. Issuer, audience, domain, URI, chain ID, nonce, issued-at, expiry, signature algorithm, key identifier, and key-rotation validation where the selected protocol requires them.
2. Replay/session binding, logout and invalidation, account change, credential status, subject offboarding, recovery, and failure semantics.
3. A mapping from an approved external subject to a contract identity reference without treating wallet possession alone as organizational assurance.
4. A bounded assurance level and source/provenance identifier, not a free-form client-supplied role or approval flag.
5. Fail-closed behavior for unknown provider, stale keys, revoked subject, missing assurance, malformed proof, expired proof, wrong audience/domain/URI/chain, replay, and unavailable verification data.

Provider selection remains an explicit decision between an approved enterprise OIDC/PKI path, an approved DID/VC path, or a wallet-signing path combined with independent organizational assurance. EIP-4361 may be used for wallet intent authentication only after its domain, URI, nonce, chain, expiry, and replay requirements are implemented. SpruceID/Heka/WeIdentity/FIWARE patterns may inform adapters; Sol DID remains a comparison candidate unless a Solana/DID-method decision is approved.

## Consequences

Identity implementation can proceed using deterministic local fixtures and test doubles without inventing external approval. The contract remains stable while provider and credential decisions are reviewed. The API, indexer, UI, and storage layers receive a consistent assurance context but cannot elevate it or turn it into legal identity.

The adapter does not itself prove employment, organizational authority, legal title, or privacy compliance. A provider, DID method, credential schema, resolver, trust registry, assurance owner, privacy basis, recovery owner, and support process must be approved before testnet, pilot, or real data.

## Required tests before provider approval

Tests must cover valid and invalid issuer/audience/domain/URI/chain/nonce/issued-at/expiry/signature algorithm/key identifier, key rotation, replay, session invalidation, account change, offboarding, recovery, credential expiry/revocation, assurance downgrade, unavailable verification service, and redaction. Contract tests must prove that adapter claims cannot bypass current canonical role, identity, lifecycle, or access state.

## References

[1]: https://github.com/spruceid/ssi "SpruceID SSI"
[2]: https://github.com/identity-com/sol-did "Sol DID"
[3]: https://github.com/FIWARE/decentralized-iam "FIWARE Decentralized IAM"
[4]: https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem "NFT Credential Management System"
[5]: https://github.com/hiero-ledger/heka-identity-platform "Heka Identity Platform"
[6]: https://github.com/WeBankBlockchain/WeIdentity "WeIdentity"
[7]: https://eips.ethereum.org/EIPS/eip-4361 "Sign-In with Ethereum"
[8]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers"
