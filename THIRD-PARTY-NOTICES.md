# Third-Party References and Notices

## Scope

This file records the repositories supplied for curated adoption review. The target repository does **not** redistribute their source code, Git history, submodules, UI assets, images, or dependencies through this reference catalog. The current product's own code remains under the repository's MIT license; third-party licenses apply only if code or assets are later adopted through a reviewed change.

License indicators were checked on **2026-08-21** using the public GitHub repository metadata and license endpoints. “No license metadata” is a warning, not a permission grant. Before copying code, recheck the upstream license file, notices, copyright, dependencies, and any contribution or asset terms.

## Reference notices

| # | Repository | Canonical URL | License indicator at review | Attribution/adoption boundary |
|---:|---|---|---|---|
| 1 | SpruceID SSI | https://github.com/spruceid/ssi | Apache-2.0 | Reference only; future Rust/SSI adoption requires Apache notice preservation and a runtime decision |
| 2 | Sol DID | https://github.com/identity-com/sol-did | MIT | Reference only; no Solana code or `did:sol` implementation is included |
| 3 | OpenZeppelin Contracts | https://github.com/OpenZeppelin/openzeppelin-contracts | MIT | Adopted runtime dependency at pinned version 5.0.2; preserve MIT notice and review upgrades |
| 4 | NFT Minting DApp Starter | https://github.com/tomhirst/nft-minting-dapp-starter | No license metadata identified | Reference only; no source, screenshot, asset, or dependency is copied |
| 5 | Markkop NFT Marketplace | https://github.com/Markkop/nft-marketplace | No license metadata identified | Reference only; no marketplace code or assets are copied |
| 6 | Polygon NFT Marketplace | https://github.com/obinnafranklinduru/NFT-MarketPlace | No license metadata identified | Reference only; no Polygon/IPFS marketplace code or assets are copied |
| 7 | NFT Auction Platform | https://github.com/furkanenesdagli/NFT_auction | No license metadata identified | Reference only; no auction code or assets are copied |
| 8 | FIWARE Decentralized IAM | https://github.com/FIWARE/decentralized-iam | Apache-2.0 | Reference pattern only; future adapter requires Apache notice and security review |
| 9 | NFT Credential Management System | https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem | MIT | Reference pattern only; no credential application code is copied |
| 10 | FileChain | https://github.com/akash70629/FileChain | MIT | Reference pattern only; no file-storage code or assets are copied |
| 11 | encryptoNFT | https://github.com/El-hacen21/encryptoNFT | BSD-3-Clause | Reference pattern only; any future cryptographic adoption requires BSD notice and independent review |
| 12 | Fileverse Self-Hosted Public Drive | https://github.com/fileverse/self-hosted-public-drive | GPL-3.0 | Reference-only boundary; no GPL code, assets, or dependency is adopted into this MIT repository |
| 13 | Hyperledger Sawtooth Asset Management | https://github.com/hkhuang07/asset-management-sawtooth | No license metadata identified | Reference only; no Sawtooth code or assets are copied |
| 14 | Heka Identity Platform | https://github.com/hiero-ledger/heka-identity-platform | Apache-2.0 | Reference pattern only; any future protocol/SDK adoption requires Apache notice and security review |
| 15 | WeIdentity | https://github.com/WeBankBlockchain/WeIdentity | Apache-2.0 indicator at review | Reference pattern only; any future Java/SDK adoption requires license-file verification and notice preservation |

## Current dependency boundary

The only adopted external runtime dependency from the supplied list is OpenZeppelin Contracts, pinned in `package.json` and used by `contracts/SecureAssetPlatform.sol`. All other repositories are documentation references and do not appear in `package.json`, `pnpm-lock.yaml`, `.gitmodules`, or the source tree.

## References

[1]: https://choosealicense.com/licenses/mit/ "MIT License overview"
[2]: https://www.apache.org/licenses/LICENSE-2.0 "Apache License 2.0"
[3]: https://opensource.org/license/bsd-3-clause/ "BSD 3-Clause License"
[4]: https://www.gnu.org/licenses/gpl-3.0.html "GNU General Public License v3.0"
[5]: https://docs.github.com/en/repositories/creating-and-managing-repositories/licensing-a-repository "GitHub licensing a repository guidance"
