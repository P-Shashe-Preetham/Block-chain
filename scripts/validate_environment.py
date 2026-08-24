#!/usr/bin/env python3
"""Validate platform environment files without loading secrets into logs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

PLACEHOLDER_MARKERS = (
    "replace-with",
    "example.invalid",
    "change-me",
    "changeme",
    "todo",
    "<your-",
    "<insert-",
)


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"{path}:{number}: expected KEY=VALUE")
        key, value = line.split("=", 1)
        key = key.strip()
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError(f"{path}:{number}: invalid variable name {key!r}")
        values[key] = value.strip().strip('"').strip("'")
    return values


def is_placeholder(value: str) -> bool:
    lowered = value.lower()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def validate_uri(key: str, value: str) -> str | None:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https", "redis", "postgresql", "postgres", "s3"}:
        return f"{key} must use an approved URI scheme"
    if parsed.scheme in {"http", "https"} and not parsed.netloc:
        return f"{key} must include a host"
    return None


def validate(path: Path, schema_path: Path, environment: str) -> list[str]:
    values = parse_env(path)
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    policy = schema.get("x-environments", {}).get(environment)
    if not policy:
        return [f"unknown environment policy: {environment}"]

    errors: list[str] = []
    properties = schema.get("properties", {})
    for key, value in values.items():
        if not value:
            if environment in {"local", "ci"}:
                continue
            errors.append(f"{key} must not be empty")
            continue
        definition = properties.get(key, {})
        if definition.get("type") == "string" and len(value) < int(definition.get("minLength", 0)):
            errors.append(f"{key} is shorter than the configured minimum")
        pattern = definition.get("pattern")
        if pattern and not re.fullmatch(pattern, value):
            errors.append(f"{key} does not match the configured format")
        if definition.get("format") == "uri":
            uri_error = validate_uri(key, value)
            if uri_error:
                errors.append(uri_error)

        if not policy.get("allowPlaceholders", False) and is_placeholder(value):
            errors.append(f"{key} contains a placeholder that is forbidden in {environment}")

    for key in policy.get("requires", []):
        if not values.get(key):
            errors.append(f"{key} is required for {environment}")

    chain_id = values.get("CHAIN_ID")
    allowed_chain_ids = policy.get("chainIds")
    if chain_id and allowed_chain_ids and int(chain_id) not in allowed_chain_ids:
        errors.append(f"CHAIN_ID {chain_id} is not allowed for {environment}")

    if environment in {"testnet", "pilot", "production"}:
        for key in ("DEPLOYER_PRIVATE_KEY", "ADMIN_PRIVATE_KEY"):
            if key in values:
                errors.append(f"{key} must be supplied through approved custody, not an environment file")
        if values.get("DATABASE_SSL_MODE") == "disable":
            errors.append("DATABASE_SSL_MODE=disable is forbidden outside local/ci")

    if environment == "production" and values.get("RPC_URL", "").startswith(("http://", "redis://")):
        errors.append("production RPC_URL must use approved encrypted transport")

    return errors


def main() -> int:
    # pnpm may forward a literal separator when the command is invoked as
    # `pnpm run validate:environment -- --file ...`; accept both forms.
    if len(sys.argv) > 1 and sys.argv[1] == "--":
        del sys.argv[1]

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", default=".env.example", type=Path)
    parser.add_argument("--schema", default="config/environment.schema.json", type=Path)
    parser.add_argument("--environment", default=None)
    args = parser.parse_args()

    environment = args.environment
    if environment is None:
        values = parse_env(args.file)
        environment = values.get("APP_ENV", "local")

    try:
        errors = validate(args.file, args.schema, environment)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"environment validation failed: {exc}", file=sys.stderr)
        return 2

    if errors:
        print(f"environment validation failed for {environment}:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"environment validation passed: {args.file} ({environment})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
