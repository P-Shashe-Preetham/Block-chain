#!/usr/bin/env python3
"""Validate the repository deployment policy's conservative defaults."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "config/deployment-policy.json"
EXPECTED_ENVIRONMENTS = {"local", "ci", "development", "testnet", "pilot", "production"}


def main() -> int:
    policy = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
    environments = policy.get("environments")
    if set(environments or {}) != EXPECTED_ENVIRONMENTS:
        raise ValueError("deployment policy must define exactly the supported environments")
    for name in ("local", "ci", "development"):
        current = environments[name]
        if current["allowedChainIds"] != [31337] or current["requiresExplicitApproval"] or not current["allowsDisposableSigner"]:
            raise ValueError(f"{name} must remain limited to disposable chain 31337")
    for name in ("testnet", "pilot", "production"):
        current = environments[name]
        if current["allowedChainIds"] or not current["requiresExplicitApproval"] or current["allowsDisposableSigner"]:
            raise ValueError(f"{name} must remain blocked until an explicit network and custody decision")
    print(f"Deployment policy validation passed for {len(environments)} environments")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"Deployment policy validation failed: {error}", file=sys.stderr)
        sys.exit(1)
