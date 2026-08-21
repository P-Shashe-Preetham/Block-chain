# Reference Integration and Curated Adoption Decisions

## Decision boundary

The 15 supplied repositories were reviewed as potential sources of architecture and implementation patterns. The current product remains a Solidity/Hardhat/OpenZeppelin local EVM MVP. External projects are not merged wholesale, vendored, added as submodules, or treated as runtime dependencies unless this document and a later ADR explicitly approve a narrowly scoped adoption.

## Curated adoption matrix

| Concern | Reference input | Decision | Current implementation boundary | Required gate before deeper adoption |
|---|---|---|---|---|
| Credential parsing and verification | SpruceID SSI | **Adopted pattern** | Model future identity adapters around parse/verify/sign boundaries; current contract stores a DID hash and uses EVM wallet authentication | Select DID/VC standards, choose runtime, verify Apache-2.0 obligations, add interoperability tests |
| DID method specification and resolution | Sol DID | **Adapter candidate** | Keep DID method open; do not add Solana or `did:sol` to the EVM MVP | Approved DID method ADR, resolver threat model, network decision, and license review |
| Secure contract primitives | OpenZeppelin Contracts | **Adopted dependency** | `@openzeppelin/contracts` 5.0.2 supplies ERC-721, AccessControl, and Pausable | Pin and review upgrades, run regression tests, review security advisories, preserve MIT notice |
| Client-side NFT minting workflow | NFT Minting DApp Starter | **Informational/pattern candidate** | Current repository has no client; README defines wallet/API boundary | Client threat model, license evidence, accessibility tests, and secure transaction preview |
| Marketplace listings and sales | Markkop NFT Marketplace | **Not selected** | Enterprise asset ownership and access are not a public marketplace | Separate marketplace ADR, legal/title review, escrow and royalty policy |
| Polygon/IPFS marketplace flow | Polygon NFT Marketplace | **Informational** | IPFS is an evaluated encrypted-storage boundary; production network remains open | Encryption, pinning, privacy, network governance, and license review |
| Auction and bidding workflow | NFT Auction Platform | **Not selected** | Auctions are outside the SIH core demo and enterprise transfer policy | Business requirement, auction abuse model, custody and legal review |
| Enterprise decentralized IAM | FIWARE Decentralized IAM | **Adopted pattern** | Use as a reference for keeping application identity/RBAC separate from contract state | API adapter design, identity assurance, license and security review |
| NFT credentials | NFT Credential Management System | **Pattern candidate** | Informs credential-to-asset mapping; no credential application is imported | Approved credential model, privacy review, lifecycle/recovery tests |
| File integrity and blockchain references | FileChain | **Pattern candidate** | Current contract records fixed-size hashes; encryption/storage service is pending | AES-256 envelope encryption, key wrapping, storage availability, retention tests |
| Encrypted NFT/DRM | encryptoNFT | **Pattern candidate** | Informs privacy-preserving asset references and post-decryption leakage limits | Cryptographic review, FHE/DRM scope decision, BSD-3-Clause notice review |
| Self-hosted decentralized drive | Fileverse Self-Hosted Public Drive | **Reference-only** | No GPL-3.0 code or assets are adopted; architecture only informs self-hosting options | GPL-3.0 compatibility review, deployment threat model, operational ownership |
| Permissioned asset ledger | Hyperledger Sawtooth Asset Management | **Informational** | Informs network alternative analysis; local Hardhat EVM remains the MVP choice | Permissioned-network ADR, validator governance, finality/privacy review, license evidence |
| SSI wallet and credential protocols | Heka Identity Platform | **Adopted pattern** | Future wallet/credential adapter may evaluate DIDComm, AnonCreds, OpenID4VC, and SD-JWT-VC boundaries | Protocol selection, data-protection review, interoperability tests, Apache-2.0 notice |
| Enterprise identity governance | WeIdentity | **Adopted pattern** | Informs enterprise DID, credential, and recovery governance; no Java/SDK dependency imported | Organizational trust model, credential lifecycle, recovery and audit review |

## What is actually adopted now

Only the OpenZeppelin Contracts package is an external runtime dependency, and it is already pinned in `package.json`. The Solidity MVP uses its ERC-721, AccessControl, and Pausable primitives. The other 14 projects are preserved as references and design inputs; their source code is not part of this repository.

The curated architectural direction is:

> **Wallet/DID authentication → application and on-chain RBAC → encrypted asset payload/CID boundary → ERC-721 token and organizational asset ID → manager-controlled transfer → explicit access decision → structured event/indexer audit.**

This direction deliberately avoids treating NFT ownership as legal title, treating IPFS as confidential storage, treating a DID registry as complete SSI, or treating a public marketplace/auction as required for the SIH MVP.

## Provenance and maintenance

The source repository, commit history, license indicator, and review date are recorded in [`REFERENCED-REPOSITORIES.md`](REFERENCED-REPOSITORIES.md). Upstream changes must not be silently copied into this repository. A future adapter or dependency requires a focused PR, an ADR or decision record, license confirmation, security review, regression tests, and updated third-party notices.

## References

[1]: https://github.com/spruceid/ssi "SpruceID SSI repository"
[2]: https://github.com/identity-com/sol-did "Sol DID repository"
[3]: https://github.com/OpenZeppelin/openzeppelin-contracts "OpenZeppelin Contracts repository"
[4]: https://github.com/FIWARE/decentralized-iam "FIWARE Decentralized IAM repository"
[5]: https://github.com/hiero-ledger/heka-identity-platform "Heka Identity Platform repository"
[6]: https://github.com/WeBankBlockchain/WeIdentity "WeIdentity repository"
[7]: https://github.com/El-hacen21/encryptoNFT "encryptoNFT repository"
[8]: https://ipfs.tech/ "IPFS documentation and project site"
[9]: https://www.w3.org/TR/did-core/ "W3C Decentralized Identifiers (DIDs) v1.0"
