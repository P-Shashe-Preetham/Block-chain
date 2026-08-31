import { isAddress, isHexString, keccak256 } from "ethers";

export const ASSET_STATUS = Object.freeze(["active", "suspended", "revoked", "retired"]);

export const VERIFIER_ABI = Object.freeze([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function assetIdByToken(uint256 tokenId) view returns (bytes32)",
  "function assetMetadataHash(uint256 tokenId) view returns (bytes32)",
  "function assetStatus(uint256 tokenId) view returns (uint8)",
  "function identityRegistry(address subject) view returns (bytes32 didHash, bool isActive, uint64 registeredAt)",
]);

export function parseVerifierArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!flag.startsWith("--")) throw new Error(`Unexpected positional argument: ${flag}`);
    if (flag === "--help") return { help: true };
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    const key = flag.slice(2);
    if (values[key] !== undefined) throw new Error(`Duplicate option: ${flag}`);
    values[key] = value;
    index += 1;
  }

  for (const required of ["rpc-url", "chain-id", "contract-address", "token-id"]) {
    if (!values[required]) throw new Error(`Missing required option: --${required}`);
  }
  if (!/^https?:\/\//.test(values["rpc-url"])) throw new Error("--rpc-url must be an HTTP(S) URL.");
  if (!/^\d+$/.test(values["chain-id"]) || BigInt(values["chain-id"]) <= 0n) throw new Error("--chain-id must be a positive integer.");
  if (!/^\d+$/.test(values["token-id"])) throw new Error("--token-id must be a non-negative integer.");
  for (const option of ["contract-address", "expected-owner"]) {
    if (values[option] && !isAddress(values[option])) throw new Error(`--${option} must be an EVM address.`);
  }
  for (const option of ["expected-asset-id", "expected-metadata-hash", "expected-code-hash"]) {
    if (values[option] && !isHexString(values[option], 32)) throw new Error(`--${option} must be a 32-byte hex value.`);
  }
  return {
    rpcUrl: values["rpc-url"],
    chainId: BigInt(values["chain-id"]),
    contractAddress: values["contract-address"],
    tokenId: BigInt(values["token-id"]),
    expectedOwner: values["expected-owner"]?.toLowerCase(),
    expectedAssetId: values["expected-asset-id"]?.toLowerCase(),
    expectedMetadataHash: values["expected-metadata-hash"]?.toLowerCase(),
    expectedCodeHash: values["expected-code-hash"]?.toLowerCase(),
  };
}

export function assessEvidence({ expected, networkChainId, code, owner, assetId, metadataHash, status, ownerIdentity, blockNumber }) {
  const normalizedCode = code.toLowerCase();
  if (normalizedCode === "0x") throw new Error("No deployed bytecode exists at the supplied contract address.");
  if (!Number.isInteger(Number(status)) || Number(status) < 0 || Number(status) >= ASSET_STATUS.length) {
    throw new Error(`Unsupported asset status returned by contract: ${status}.`);
  }
  const evidence = {
    source: "direct-rpc-contract-read",
    chain_id: networkChainId.toString(),
    block_number: blockNumber.toString(),
    contract_address: expected.contractAddress.toLowerCase(),
    deployed_code_hash: keccak256(code),
    token_id: expected.tokenId.toString(),
    owner: owner.toLowerCase(),
    asset_id: assetId.toLowerCase(),
    metadata_hash: metadataHash.toLowerCase(),
    asset_status: ASSET_STATUS[Number(status)],
    owner_identity_active: Boolean(ownerIdentity.isActive),
    owner_identity_registered_at: ownerIdentity.registeredAt.toString(),
  };
  const mismatches = [];
  if (networkChainId !== expected.chainId) mismatches.push("chain_id");
  if (expected.expectedOwner && evidence.owner !== expected.expectedOwner) mismatches.push("owner");
  if (expected.expectedAssetId && evidence.asset_id !== expected.expectedAssetId) mismatches.push("asset_id");
  if (expected.expectedMetadataHash && evidence.metadata_hash !== expected.expectedMetadataHash) mismatches.push("metadata_hash");
  if (expected.expectedCodeHash && evidence.deployed_code_hash !== expected.expectedCodeHash) mismatches.push("deployed_code_hash");
  return { verified: mismatches.length === 0, mismatches, evidence };
}
