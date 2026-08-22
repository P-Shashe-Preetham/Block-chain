from __future__ import annotations

import unittest

from services.indexer.consumer import ConfirmedScanner, JsonRpcClient, RawChainLog, RpcError
from services.indexer.projector import CanonicalEvent, EventKey, InMemoryProjection


CONTRACT = "0x0000000000000000000000000000000000000001"


def response(request: dict[str, object], result: object) -> dict[str, object]:
    return {"jsonrpc": "2.0", "id": request["id"], "result": result}


class FakeTransport:
    def __init__(self, responses_by_method: dict[str, list[object]], failures: set[str] | None = None) -> None:
        self.responses_by_method = {key: list(value) for key, value in responses_by_method.items()}
        self.failures = failures or set()
        self.calls: list[tuple[str, str]] = []

    def __call__(self, endpoint: str, request: dict[str, object], _: float) -> dict[str, object]:
        method = str(request["method"])
        self.calls.append((endpoint, method))
        if endpoint in self.failures:
            raise OSError("provider unavailable")
        values = self.responses_by_method[method]
        return response(request, values.pop(0))


class ConsumerTests(unittest.TestCase):
    def test_failover_retries_then_uses_second_provider(self) -> None:
        transport = FakeTransport(
            {"eth_blockNumber": ["0x2"]},
            failures={"http://primary.test"},
        )
        client = JsonRpcClient(
            ["http://primary.test", "http://secondary.test"],
            max_attempts_per_endpoint=2,
            sleep=lambda _: None,
            transport=transport,
        )
        self.assertEqual(client.block_number(), 2)
        self.assertEqual(transport.calls, [
            ("http://primary.test", "eth_blockNumber"),
            ("http://primary.test", "eth_blockNumber"),
            ("http://secondary.test", "eth_blockNumber"),
        ])

    def test_scanner_only_processes_confirmed_range_and_deduplicates_retries(self) -> None:
        transport = FakeTransport(
            {
                "eth_blockNumber": ["0x3"],
                "eth_getBlockByNumber": [
                    {"hash": "0xblock-1"},
                    {"hash": "0xblock-2"},
                ],
                "eth_getLogs": [
                    [{"transactionHash": "0xtx-1", "logIndex": "0x0", "topics": ["0xtopic"], "data": "0x"}],
                    [],
                ],
            }
        )
        projection = InMemoryProjection()
        client = JsonRpcClient(["http://rpc.test"], sleep=lambda _: None, transport=transport)
        scanner = ConfirmedScanner(client, CONTRACT, projection)

        def decoder(log: RawChainLog) -> CanonicalEvent:
            return CanonicalEvent(
                EventKey(31337, CONTRACT, log.transaction_hash, log.log_index),
                log.block_number,
                log.block_hash,
                "AssetRegistered",
            )

        first = scanner.scan(1, confirmations=1, decoder=decoder)
        self.assertEqual((first.head_block, first.confirmed_through, first.scanned_blocks, first.observed_logs, first.projected_events), (3, 2, 2, 1, 1))
        self.assertEqual(len(projection.events), 1)

    def test_rpc_response_identity_and_malformed_log_fail_closed(self) -> None:
        def wrong_id(_: str, request: dict[str, object], __: float) -> dict[str, object]:
            return {"jsonrpc": "2.0", "id": int(request["id"]) + 1, "result": "0x1"}

        client = JsonRpcClient(["http://rpc.test"], max_attempts_per_endpoint=1, transport=wrong_id, sleep=lambda _: None)
        with self.assertRaises(RpcError):
            client.block_number()

        transport = FakeTransport(
            {
                "eth_blockNumber": ["0x1"],
                "eth_getBlockByNumber": [{"hash": "0xblock-1"}],
                "eth_getLogs": [[{"transactionHash": "0xtx", "logIndex": "not-hex", "topics": [], "data": "0x"}]],
            }
        )
        scanner = ConfirmedScanner(JsonRpcClient(["http://rpc.test"], transport=transport), CONTRACT, InMemoryProjection())
        with self.assertRaises(RpcError):
            scanner.scan(1, confirmations=0)


if __name__ == "__main__":
    unittest.main()
