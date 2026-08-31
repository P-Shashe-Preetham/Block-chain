import assert from "node:assert/strict";
import test from "node:test";
import { assessEvidence, parseVerifierArgs } from "../lib/asset_verifier.mjs";

const address = "0x1111111111111111111111111111111111111111";
const bytes32 = `0x${"a".repeat(64)}`;
const code = "0x6001600055";

test("verifier rejects incomplete or malformed direct-RPC input", () => {
  assert.throws(() => parseVerifierArgs(["--rpc-url", "https://rpc.invalid"]), /Missing required option/);
  assert.throws(() => parseVerifierArgs(["--rpc-url", "ftp://rpc.invalid", "--chain-id", "1", "--contract-address", address, "--token-id", "0"]), /HTTP/);
});

test("verifier reports direct contract evidence only when all supplied expectations match", () => {
  const expected = parseVerifierArgs([
    "--rpc-url", "https://rpc.invalid", "--chain-id", "31337", "--contract-address", address, "--token-id", "4",
    "--expected-owner", address, "--expected-asset-id", bytes32,
  ]);
  const result = assessEvidence({
    expected,
    networkChainId: 31337n,
    code,
    owner: address,
    assetId: bytes32,
    metadataHash: `0x${"b".repeat(64)}`,
    status: 0n,
    ownerIdentity: { isActive: true, registeredAt: 10n },
    blockNumber: 99,
  });
  assert.equal(result.verified, true);
  assert.equal(result.evidence.source, "direct-rpc-contract-read");
  assert.deepEqual(result.mismatches, []);
});

test("verifier identifies a network or expectation mismatch without claiming success", () => {
  const expected = parseVerifierArgs([
    "--rpc-url", "https://rpc.invalid", "--chain-id", "1", "--contract-address", address, "--token-id", "4",
    "--expected-owner", "0x2222222222222222222222222222222222222222",
  ]);
  const result = assessEvidence({
    expected,
    networkChainId: 31337n,
    code,
    owner: address,
    assetId: bytes32,
    metadataHash: `0x${"b".repeat(64)}`,
    status: 1n,
    ownerIdentity: { isActive: false, registeredAt: 0n },
    blockNumber: 99,
  });
  assert.equal(result.verified, false);
  assert.deepEqual(result.mismatches, ["chain_id", "owner"]);
});
