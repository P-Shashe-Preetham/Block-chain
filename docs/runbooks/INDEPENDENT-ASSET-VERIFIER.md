# Independent Asset Verifier

## Purpose and trust boundary

`scripts/verify_asset.mjs` is an **independent direct-RPC read tool**. It uses a supplied RPC endpoint and the canonical read ABI to obtain deployed bytecode, network chain ID, current block number, ERC-721 owner, asset identifier commitment, metadata commitment, lifecycle status, and the current owner's on-chain identity state. It does not read the browser console, FastAPI, PostgreSQL, indexer, transaction intent, wallet, key storage, or decrypted content.

The tool proves only what its configured RPC endpoint returns at its observed block. It does not validate legal title, physical possession, identity assurance, off-chain ciphertext, key release, or finality unless a separately approved network/finality policy and corresponding evidence are supplied.

## Command

```bash
pnpm test:verifier
node scripts/verify_asset.mjs \
  --rpc-url https://APPROVED-RPC.example \
  --chain-id 31337 \
  --contract-address 0xAPPROVEDCONTRACT \
  --token-id 0 \
  --expected-owner 0xEXPECTEDOWNER \
  --expected-asset-id 0xEXPECTED_BYTES32 \
  --expected-metadata-hash 0xEXPECTED_BYTES32 \
  --expected-code-hash 0xEXPECTED_BYTES32
```

All required values must be reviewed deployment evidence. The repository has no approved network, deployed contract address, finality policy, or testnet authorization, so the command must not be presented as a completed real-network verification walkthrough.

## Result interpretation

| Result | Meaning |
|---|---|
| JSON `verified: true` | All supplied expectations match direct reads from the supplied endpoint at the observed block; it is not a production/legal/finality certification. |
| JSON `verified: false` with `mismatches` | The expected chain, owner, commitment, or bytecode hash did not match; treat the claim as unverified. |
| Exit code `2` | Input, endpoint, ABI read, missing bytecode, or unsupported status made verification unavailable. |
| Exit code `3` | Direct reads succeeded but one or more supplied expectations did not match. |

Retain only sanitized result JSON and relevant approved deployment inputs in release evidence. Never include private keys, credentials embedded in RPC URLs, real identity data, decrypted files, or raw sensitive payloads.
