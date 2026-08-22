"""Read-only JSON-RPC scanner for the canonical projection baseline.

The scanner intentionally does not submit transactions, decide authorization,
or persist state. It verifies provider responses, rotates across configured RPC
endpoints after bounded failures, scans only through an explicit confirmation
depth, and hands decoded events to the deterministic projector.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .projector import CanonicalEvent, InMemoryProjection


class RpcError(RuntimeError):
    """Raised when all configured RPC providers fail a request."""


@dataclass(frozen=True)
class RawChainLog:
    block_number: int
    block_hash: str
    transaction_hash: str
    log_index: int
    address: str
    topics: tuple[str, ...]
    data: str


@dataclass(frozen=True)
class ScanResult:
    head_block: int
    confirmed_through: int
    scanned_blocks: int
    observed_logs: int
    projected_events: int


Transport = Callable[[str, dict[str, Any], float], dict[str, Any]]
Decoder = Callable[[RawChainLog], CanonicalEvent | None]


class JsonRpcClient:
    def __init__(
        self,
        endpoints: Sequence[str],
        *,
        timeout_seconds: float = 5.0,
        max_attempts_per_endpoint: int = 2,
        sleep: Callable[[float], None] = time.sleep,
        transport: Transport | None = None,
    ) -> None:
        if not endpoints or any(not endpoint.startswith(("http://", "https://")) for endpoint in endpoints):
            raise ValueError("at least one HTTP(S) RPC endpoint is required")
        if timeout_seconds <= 0 or max_attempts_per_endpoint < 1:
            raise ValueError("timeout and retry attempts must be positive")
        self._endpoints = tuple(endpoints)
        self._timeout = timeout_seconds
        self._max_attempts = max_attempts_per_endpoint
        self._sleep = sleep
        self._transport = transport or _http_transport
        self._request_id = 0

    def call(self, method: str, params: list[Any]) -> Any:
        if not method or not isinstance(params, list):
            raise ValueError("JSON-RPC method and parameters are required")
        failures: list[str] = []
        for endpoint in self._endpoints:
            for attempt in range(self._max_attempts):
                self._request_id += 1
                request = {"jsonrpc": "2.0", "id": self._request_id, "method": method, "params": params}
                try:
                    payload = self._transport(endpoint, request, self._timeout)
                    if payload.get("jsonrpc") != "2.0" or payload.get("id") != self._request_id:
                        raise RpcError("RPC response identity mismatch")
                    if "error" in payload:
                        raise RpcError(f"RPC method failed: {method}")
                    if "result" not in payload:
                        raise RpcError("RPC response omitted result")
                    return payload["result"]
                except (RpcError, OSError, HTTPError, URLError, TimeoutError, ValueError) as error:
                    failures.append(f"{endpoint} attempt {attempt + 1}: {error}")
                    if attempt + 1 < self._max_attempts:
                        self._sleep(0.25 * (2**attempt))
        raise RpcError("all RPC providers failed: " + "; ".join(failures))

    def block_number(self) -> int:
        result = self.call("eth_blockNumber", [])
        return _hex_int(result, "block number")

    def block_with_logs(self, block_number: int, contract_address: str) -> tuple[str, tuple[RawChainLog, ...]]:
        if block_number < 0 or len(contract_address) != 42 or not contract_address.startswith("0x"):
            raise ValueError("block number or contract address is invalid")
        block = self.call("eth_getBlockByNumber", [_hex(block_number), False])
        if not isinstance(block, dict) or not isinstance(block.get("hash"), str):
            raise RpcError("RPC returned no canonical block")
        block_hash = block["hash"]
        logs = self.call(
            "eth_getLogs",
            [{"fromBlock": _hex(block_number), "toBlock": _hex(block_number), "address": contract_address}],
        )
        if not isinstance(logs, list):
            raise RpcError("RPC returned invalid logs")
        return block_hash, tuple(_parse_log(log, block_number, block_hash, contract_address) for log in logs)


class ConfirmedScanner:
    """Scan a confirmed range into the deterministic in-memory reference projection."""

    def __init__(self, client: JsonRpcClient, contract_address: str, projection: InMemoryProjection) -> None:
        if len(contract_address) != 42 or not contract_address.startswith("0x"):
            raise ValueError("contract address must be a 20-byte 0x-prefixed address")
        self._client = client
        self._contract_address = contract_address
        self._projection = projection

    def scan(self, start_block: int, *, confirmations: int, decoder: Decoder | None = None) -> ScanResult:
        if start_block < 0 or confirmations < 0:
            raise ValueError("start block and confirmation depth must be non-negative")
        head_block = self._client.block_number()
        confirmed_through = head_block - confirmations
        if confirmed_through < start_block:
            return ScanResult(head_block, confirmed_through, 0, 0, 0)
        scanned = 0
        observed_logs = 0
        projected_events = 0
        for block_number in range(start_block, confirmed_through + 1):
            block_hash, logs = self._client.block_with_logs(block_number, self._contract_address)
            self._projection.checkpoint(block_number, block_hash)
            scanned += 1
            observed_logs += len(logs)
            if decoder:
                for log in logs:
                    event = decoder(log)
                    if event is not None and self._projection.ingest(event):
                        projected_events += 1
        return ScanResult(head_block, confirmed_through, scanned, observed_logs, projected_events)


def _http_transport(endpoint: str, request: dict[str, Any], timeout: float) -> dict[str, Any]:
    body = json.dumps(request).encode("utf-8")
    http_request = Request(endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(http_request, timeout=timeout) as response:  # nosec B310: endpoint is operator-configured and validated
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, dict):
        raise RpcError("RPC response must be a JSON object")
    return payload


def _parse_log(value: object, block_number: int, block_hash: str, address: str) -> RawChainLog:
    if not isinstance(value, dict):
        raise RpcError("RPC returned a malformed log")
    transaction_hash = value.get("transactionHash")
    log_index = value.get("logIndex")
    topics = value.get("topics")
    data = value.get("data")
    if not isinstance(transaction_hash, str) or not isinstance(log_index, str) or not isinstance(topics, list) or not isinstance(data, str):
        raise RpcError("RPC log is missing canonical fields")
    if not all(isinstance(topic, str) for topic in topics):
        raise RpcError("RPC log topics are invalid")
    return RawChainLog(block_number, block_hash, transaction_hash, _hex_int(log_index, "log index"), address, tuple(topics), data)


def _hex(value: int) -> str:
    return hex(value)


def _hex_int(value: object, field: str) -> int:
    if not isinstance(value, str) or not value.startswith("0x"):
        raise RpcError(f"RPC {field} is not a hex quantity")
    try:
        result = int(value, 16)
    except ValueError as error:
        raise RpcError(f"RPC {field} is invalid") from error
    if result < 0:
        raise RpcError(f"RPC {field} is negative")
    return result
