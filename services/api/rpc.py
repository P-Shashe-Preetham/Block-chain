"""Safe, read-only RPC checks used by API readiness.

The API never treats its projection as canonical. Readiness verifies the
configured chain identity and that the configured contract address has code;
transaction submission and contract-state authorization remain separate work.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import httpx

from .config import Settings


JSONRPC_REQUESTS = (
    {"jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": []},
    {"jsonrpc": "2.0", "id": 2, "method": "eth_getCode", "params": []},
)


def _valid_response(response: Any, expected_id: int) -> dict[str, Any] | None:
    if getattr(response, "status_code", None) != 200:
        return None
    try:
        payload = response.json()
    except (TypeError, ValueError):
        return None
    if not isinstance(payload, dict) or payload.get("jsonrpc") != "2.0" or payload.get("id") != expected_id:
        return None
    if "error" in payload or "result" not in payload:
        return None
    return payload


def verify_rpc_contract(
    settings: Settings,
    *,
    client_factory: Callable[..., Any] = httpx.Client,
) -> bool:
    """Return true only when the configured RPC matches chain and contract identity."""
    if not settings.contract_address:
        return False
    try:
        with client_factory(timeout=2.0, trust_env=False) as client:
            chain_response = client.post(settings.rpc_url, json=JSONRPC_REQUESTS[0])
            chain_payload = _valid_response(chain_response, 1)
            if not chain_payload or not isinstance(chain_payload["result"], str):
                return False
            if int(chain_payload["result"], 16) != settings.chain_id:
                return False

            code_request = {**JSONRPC_REQUESTS[1], "params": [settings.contract_address, "latest"]}
            code_response = client.post(settings.rpc_url, json=code_request)
            code_payload = _valid_response(code_response, 2)
            code = code_payload.get("result") if code_payload else None
            return isinstance(code, str) and code.startswith("0x") and code != "0x"
    except (httpx.HTTPError, TypeError, ValueError, OSError):
        return False
