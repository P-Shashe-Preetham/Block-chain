# Referenced Repositories

## Purpose and review boundary

This catalog records the 15 repositories supplied for curated adoption review. They are **references, not automatic dependencies**. No source tree, Git history, submodule, asset, or unreviewed package is imported by this catalog. Repository metadata and license indicators were reviewed on **2026-08-21** through the public GitHub repository pages/API; maintainers must recheck each license before adopting code.

The catalog preserves every canonical URL exactly as supplied. A project may inform a design decision without being suitable for code adoption. “License not identified” means no machine-readable GitHub license metadata was available during review; it is not permission to copy code.

## Catalog

| # | Repository | Category | License indicator at review | Relevant lesson or capability | Curated adoption decision |
|---:|---|---|---|---|---|
| 1 | [SpruceID SSI](https://github.com/spruceid/ssi) [1] | SSI, DIDs, VCs, VPs | Apache-2.0 | Modular parsing, signing, and verification of DID/credential claims; Rust implementation | **Adopt pattern:** use as a reference for future credential verification boundaries; do not add Rust runtime until a DID/VC decision is approved |
| 2 | [Sol DID](https://github.com/identity-com/sol-did) [2] | DID method and resolver | MIT | DID method specification, on-chain DID documents, client, CLI, and resolver-driver separation | **Informational:** useful for DID-method lifecycle and resolver boundaries; Solana is not selected for the EVM MVP |
| 3 | [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) [3] | Secure Solidity primitives | MIT | ERC-721, AccessControl, Pausable, and reusable contract security patterns | **Adopted dependency:** the MVP already uses the pinned `@openzeppelin/contracts` 5.0.2 package; upgrades require CI, security review, and compatibility checks |
| 4 | [NFT Minting DApp Starter](https://github.com/tomhirst/nft-minting-dapp-starter) [4] | NFT minting client | No license metadata identified | Minimal Hardhat/React/Next.js client-to-contract flow | **Pattern candidate:** use only for local wallet/client onboarding ideas; no code or assets adopted without license evidence |
| 5 | [Markkop NFT Marketplace](https://github.com/Markkop/nft-marketplace) [5] | NFT marketplace | No license metadata identified | Next.js, Hardhat, Solidity marketplace workflow | **Informational:** marketplace behavior is outside the current enterprise ownership/access scope; no code adoption |
| 6 | [Polygon NFT Marketplace](https://github.com/obinnafranklinduru/NFT-MarketPlace) [6] | Polygon, IPFS, NFT marketplace | No license metadata identified | Polygon/IPFS marketplace integration concepts | **Informational:** private/permissioned network selection remains open; no marketplace or asset code adopted |
| 7 | [NFT Auction Platform](https://github.com/furkanenesdagli/NFT_auction) [7] | NFT auction and bidding | No license metadata identified | Bidding, auction state, and full-stack transaction workflow concepts | **Not selected:** auctions are not required for the SIH MVP; no code or assets adopted |
| 8 | [FIWARE Decentralized IAM](https://github.com/FIWARE/decentralized-iam) [8] | Decentralized IAM | Apache-2.0 | Enterprise identity and authorization integration boundaries | **Adopt pattern:** inform API/RBAC separation and future enterprise identity adapters; no implementation dependency added |
| 9 | [NFT Credential Management System](https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem) [9] | NFT credentials | MIT | Credential lifecycle and NFT-backed credential workflow concepts | **Pattern candidate:** informs credential-to-asset mapping and audit requirements; no code adopted |
| 10 | [FileChain](https://github.com/akash70629/FileChain) [10] | Blockchain file workflows | MIT | File reference, integrity anchoring, and decentralized file-management concepts | **Pattern candidate:** informs encrypted-payload/CID boundaries; no storage implementation imported |
| 11 | [encryptoNFT](https://github.com/El-hacen21/encryptoNFT) [11] | Encrypted NFT and DRM | BSD-3-Clause | Privacy-preserving digital-rights and encrypted NFT concepts | **Pattern candidate:** informs confidentiality and post-decryption limitation language; no cryptographic code adopted |
| 12 | [Fileverse Self-Hosted Public Drive](https://github.com/fileverse/self-hosted-public-drive) [12] | Self-hosted decentralized files | GPL-3.0 | Self-hosting, decentralized file access, and public-drive workflow concepts | **Reference-only:** GPL-3.0 requires a separate compatibility review; no code, assets, or dependency adopted |
| 13 | [Hyperledger Sawtooth Asset Management](https://github.com/hkhuang07/asset-management-sawtooth) [13] | Permissioned ledger asset management | No license metadata identified | Permissioned-ledger asset authentication, encrypted hashes, and monitoring concepts | **Informational:** informs the Fabric/private-ledger alternative; the MVP remains local Hardhat EVM |
| 14 | [Heka Identity Platform](https://github.com/hiero-ledger/heka-identity-platform) [14] | SSI wallet and identity platform | Apache-2.0 | DIDComm, AnonCreds, OpenID4VC, SD-JWT-VC, wallet, and verifiable-credential patterns | **Adopt pattern:** future wallet/credential adapter reference; no TypeScript identity platform dependency added |
| 15 | [WeIdentity](https://github.com/WeBankBlockchain/WeIdentity) [15] | Enterprise identity and credentials | Apache-2.0 indicator at review | Enterprise DID, credential, and blockchain identity governance concepts | **Adopt pattern:** informs enterprise identity governance and recovery boundaries; no code adopted |

## Adoption rules

The only current external runtime dependency from this list is **OpenZeppelin Contracts**, already pinned and used by the Solidity MVP. All other repositories remain architecture, workflow, or security references until a separate ADR approves a concrete adapter or dependency.

Any future adoption must identify the exact files or API boundary, verify the upstream license and notices, record security and maintenance risks, add tests, and preserve the upstream attribution. A repository's presence in this catalog does not constitute endorsement, audit evidence, compatibility certification, or permission to copy code.

## References

[1]: https://github.com/spruceid/ssi "SpruceID SSI repository"
[2]: https://github.com/identity-com/sol-did "Sol DID repository"
[3]: https://github.com/OpenZeppelin/openzeppelin-contracts "OpenZeppelin Contracts repository"
[4]: https://github.com/tomhirst/nft-minting-dapp-starter "NFT Minting DApp Starter repository"
[5]: https://github.com/Markkop/nft-marketplace "Markkop NFT Marketplace repository"
[6]: https://github.com/obinnafranklinduru/NFT-MarketPlace "Polygon NFT Marketplace repository"
[7]: https://github.com/furkanenesdagli/NFT_auction "NFT Auction Platform repository"
[8]: https://github.com/FIWARE/decentralized-iam "FIWARE Decentralized IAM repository"
[9]: https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem "NFT Credential Management System repository"
[10]: https://github.com/akash70629/FileChain "FileChain repository"
[11]: https://github.com/El-hacen21/encryptoNFT "encryptoNFT repository"
[12]: https://github.com/fileverse/self-hosted-public-drive "Fileverse Self-Hosted Public Drive repository"
[13]: https://github.com/hkhuang07/asset-management-sawtooth "Hyperledger Sawtooth Asset Management repository"
[14]: https://github.com/hiero-ledger/heka-identity-platform "Heka Identity Platform repository"
[15]: https://github.com/WeBankBlockchain/WeIdentity "WeIdentity repository"
