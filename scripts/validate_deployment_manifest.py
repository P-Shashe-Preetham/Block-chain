"""Validate a generated SecureAssetPlatform deployment manifest.

This checks manifest integrity and policy metadata only. It cannot prove that a
contract address still has the recorded bytecode without querying the approved
RPC, and it does not replace deployment approval or signature verification.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


ENVIRONMENTS = {"local", "ci", "development", "testnet", "pilot", "production"}
HEX_ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")
HEX_HASH = re.compile(r"^0x[a-fA-F0-9]{64}$")
COMMIT = re.compile(r"^[0-9a-fA-F]{40,64}$")
ALLOWED_KEYS = {
    "schemaVersion", "environment", "networkName", "chainId", "rpcIdentity", "contractName",
    "contractAddress", "bytecodeHash", "abiHash", "sourceCommit", "compiler", "optimizer",
    "evmVersion", "deployer", "deployerCustody", "deployedAt", "verification",
}


class ManifestError(ValueError):
    pass


def validate_manifest(value: object, policy: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ManifestError("manifest must be a JSON object")
    required = ALLOWED_KEYS - {"verification"}
    missing = required - set(value)
    if missing:
        raise ManifestError("manifest is missing: " + ", ".join(sorted(missing)))
    unknown = set(value) - ALLOWED_KEYS
    if unknown:
        raise ManifestError("manifest has unknown fields: " + ", ".join(sorted(unknown)))
    if value["schemaVersion"] != 1:
        raise ManifestError("unsupported manifest schema version")
    environment = value["environment"]
    if environment not in ENVIRONMENTS:
        raise ManifestError("manifest environment is invalid")
    if not isinstance(value["networkName"], str) or not value["networkName"]:
        raise ManifestError("networkName is required")
    if not isinstance(value["rpcIdentity"], str) or not value["rpcIdentity"]:
        raise ManifestError("rpcIdentity is required")
    if not isinstance(value["chainId"], int) or isinstance(value["chainId"], bool) or value["chainId"] < 1:
        raise ManifestError("chainId must be a positive integer")
    if value["contractName"] != "SecureAssetPlatform":
        raise ManifestError("unexpected contract name")
    for field in ("contractAddress", "deployer"):
        if not isinstance(value[field], str) or not HEX_ADDRESS.fullmatch(value[field]):
            raise ManifestError(f"{field} must be a 20-byte hex address")
    for field in ("bytecodeHash", "abiHash"):
        if not isinstance(value[field], str) or not HEX_HASH.fullmatch(value[field]):
            raise ManifestError(f"{field} must be a 32-byte hex hash")
    if not isinstance(value["sourceCommit"], str) or not COMMIT.fullmatch(value["sourceCommit"]):
        raise ManifestError("sourceCommit must be a full commit hash")
    if value["compiler"] != "0.8.24" or value["evmVersion"] != "cancun":
        raise ManifestError("compiler or EVM target does not match the MVP build policy")
    optimizer = value["optimizer"]
    if not isinstance(optimizer, dict) or set(optimizer) != {"enabled", "runs"}:
        raise ManifestError("optimizer metadata is invalid")
    if not isinstance(optimizer["enabled"], bool) or not isinstance(optimizer["runs"], int) or optimizer["runs"] < 1:
        raise ManifestError("optimizer metadata is invalid")
    if not isinstance(value["deployerCustody"], str) or not value["deployerCustody"]:
        raise ManifestError("deployerCustody is required")
    try:
        datetime.fromisoformat(str(value["deployedAt"]).replace("Z", "+00:00"))
    except ValueError as error:
        raise ManifestError("deployedAt must be an ISO-8601 timestamp") from error

    environment_policy = policy.get("environments", {}).get(environment)
    if not isinstance(environment_policy, dict):
        raise ManifestError(f"deployment policy has no entry for {environment}")
    allowed_chain_ids = environment_policy.get("allowedChainIds")
    if not isinstance(allowed_chain_ids, list) or value["chainId"] not in allowed_chain_ids:
        raise ManifestError(f"chain ID {value['chainId']} is not allowed for {environment}")
    if environment_policy.get("allowsDisposableSigner") is True:
        if value["deployerCustody"] != "disposable-local-signer":
            raise ManifestError("disposable environment must identify disposable signer custody")
    else:
        if value["deployerCustody"] == "disposable-local-signer":
            raise ManifestError("non-local environment cannot use disposable signer custody")
        verification = value.get("verification")
        if not isinstance(verification, dict) or not isinstance(verification.get("manifestSignature"), str) or not verification["manifestSignature"]:
            raise ManifestError("non-local manifest requires external manifest-signature evidence")
    return value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument("--policy", type=Path, default=Path("config/deployment-policy.json"))
    argv = sys.argv[1:]
    if argv and argv[0] == "--":
        argv = argv[1:]
    args = parser.parse_args(argv)
    try:
        manifest = json.loads(args.file.read_text(encoding="utf-8"))
        policy = json.loads(args.policy.read_text(encoding="utf-8"))
        validate_manifest(manifest, policy)
    except (OSError, json.JSONDecodeError, ManifestError) as error:
        print(f"Deployment manifest validation failed: {error}", file=sys.stderr)
        return 1
    print(f"Deployment manifest validation passed: {args.file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
