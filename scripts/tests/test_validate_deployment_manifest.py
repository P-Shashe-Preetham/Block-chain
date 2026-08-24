from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from scripts.validate_deployment_manifest import ManifestError, validate_manifest


ROOT = Path(__file__).resolve().parents[2]
POLICY = json.loads((ROOT / "config/deployment-policy.json").read_text(encoding="utf-8"))


def valid_manifest() -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "environment": "local",
        "networkName": "hardhat-local",
        "chainId": 31337,
        "rpcIdentity": "hardhat-local-provider",
        "contractName": "SecureAssetPlatform",
        "contractAddress": "0x0000000000000000000000000000000000000001",
        "bytecodeHash": "0x" + "1" * 64,
        "abiHash": "0x" + "2" * 64,
        "sourceCommit": "a" * 40,
        "compiler": "0.8.24",
        "optimizer": {"enabled": True, "runs": 200},
        "evmVersion": "cancun",
        "deployer": "0x0000000000000000000000000000000000000002",
        "deployerCustody": "disposable-local-signer",
        "deployedAt": "2026-08-23T00:00:00Z",
    }


class DeploymentManifestTests(unittest.TestCase):
    def test_valid_local_manifest_is_accepted(self) -> None:
        self.assertEqual(validate_manifest(valid_manifest(), POLICY)["environment"], "local")

    def test_required_and_unknown_fields_are_rejected(self) -> None:
        missing = valid_manifest()
        del missing["networkName"]
        with self.assertRaises(ManifestError):
            validate_manifest(missing, POLICY)
        unknown = valid_manifest()
        unknown["privateKey"] = "must-not-be-here"
        with self.assertRaises(ManifestError):
            validate_manifest(unknown, POLICY)

    def test_build_metadata_drift_is_rejected(self) -> None:
        invalid = valid_manifest()
        invalid["compiler"] = "0.8.25"
        with self.assertRaises(ManifestError):
            validate_manifest(invalid, POLICY)
        invalid = valid_manifest()
        invalid["bytecodeHash"] = "0x1234"
        with self.assertRaises(ManifestError):
            validate_manifest(invalid, POLICY)

    def test_non_local_disposable_custody_is_rejected_even_if_chain_is_allowed(self) -> None:
        policy = copy.deepcopy(POLICY)
        policy["environments"]["production"]["allowedChainIds"] = [31337]
        invalid = valid_manifest()
        invalid["environment"] = "production"
        with self.assertRaises(ManifestError):
            validate_manifest(invalid, policy)


if __name__ == "__main__":
    unittest.main()
