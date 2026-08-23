#!/usr/bin/env node
import { Contract, JsonRpcProvider } from "ethers";
import { assessEvidence, parseVerifierArgs, VERIFIER_ABI } from "./lib/asset_verifier.mjs";

const usage = `Usage: node scripts/verify_asset.mjs --rpc-url <https-url> --chain-id <id> --contract-address <address> --token-id <id> [--expected-owner <address>] [--expected-asset-id <bytes32>] [--expected-metadata-hash <bytes32>] [--expected-code-hash <bytes32>]

The verifier reads a supplied RPC endpoint and contract directly. It never reads the browser, API projection, indexer database, wallet, key store, or transaction-intent state.`;

async function main() {
  const expected = parseVerifierArgs(process.argv.slice(2));
  if (expected.help) {
    console.log(usage);
    return;
  }
  const provider = new JsonRpcProvider(expected.rpcUrl, undefined, { staticNetwork: false });
  const network = await provider.getNetwork();
  const [blockNumber, code] = await Promise.all([
    provider.getBlockNumber(),
    provider.getCode(expected.contractAddress),
  ]);
  const contract = new Contract(expected.contractAddress, VERIFIER_ABI, provider);
  const [owner, assetId, metadataHash, status] = await Promise.all([
    contract.ownerOf(expected.tokenId),
    contract.assetIdByToken(expected.tokenId),
    contract.assetMetadataHash(expected.tokenId),
    contract.assetStatus(expected.tokenId),
  ]);
  const ownerIdentity = await contract.identityRegistry(owner);
  const result = assessEvidence({
    expected,
    networkChainId: network.chainId,
    code,
    owner,
    assetId,
    metadataHash,
    status,
    ownerIdentity,
    blockNumber,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.verified) process.exitCode = 3;
}

main().catch((error) => {
  console.error(`Verification unavailable: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
});
