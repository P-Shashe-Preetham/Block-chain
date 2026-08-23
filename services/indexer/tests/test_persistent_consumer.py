import unittest

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from services.indexer.consumer import JsonRpcClient, PersistentConfirmedScanner
from services.indexer.runner import PersistentConfirmedScanOnce
from services.persistence.models import Base, CanonicalEventRecord, RawChainLogRecord


CONTRACT = "0x" + "ab" * 20
SUBJECT = "0x" + "12" * 20
ACTION = "0x" + "56" * 32
DECISION_TOPIC = "0x94312429f260fe5dbea4725e0cbd9b951191f77a6d0dc08f455c2298b7442256"


def word(value: str) -> str:
    return "0x" + value[2:].rjust(64, "0")


class FakeTransport:
    def __init__(self) -> None:
        self.block_calls = 0
        self.log_calls = 0

    def __call__(self, _: str, request: dict[str, object], __: float) -> dict[str, object]:
        method = request["method"]
        if method == "eth_blockNumber":
            result = "0xc"
        elif method == "eth_getBlockByNumber":
            self.block_calls += 1
            result = {"hash": "0x" + str(self.block_calls).zfill(64)}
        elif method == "eth_getLogs":
            self.log_calls += 1
            result = []
            if self.log_calls == 1:
                result = [{
                    "transactionHash": "0x" + "cd" * 32,
                    "logIndex": "0x0",
                    "topics": [DECISION_TOPIC, word(SUBJECT), word("0x9"), ACTION],
                    "data": word("0x1"),
                }]
        else:
            raise AssertionError(f"unexpected method {method}")
        return {"jsonrpc": "2.0", "id": request["id"], "result": result}


class PersistentConsumerTests(unittest.TestCase):
    def test_confirmed_scanner_persists_decoded_event_and_raw_log(self) -> None:
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        transport = FakeTransport()
        client = JsonRpcClient(["http://rpc.test"], transport=transport, sleep=lambda _: None)
        with Session(engine) as session:
            scanner = PersistentConfirmedScanner(
                client,
                chain_id=31337,
                contract_address=CONTRACT,
                session=session,
                confirmations=1,
            )
            result = scanner.scan(10)
            self.assertEqual((result.head_block, result.confirmed_through, result.scanned_blocks, result.observed_logs, result.projected_events), (12, 11, 2, 1, 1))
            self.assertEqual(session.scalar(select(CanonicalEventRecord)).event_name, "AccessDecision")
            raw = session.scalar(select(RawChainLogRecord))
            self.assertEqual(raw.data_hex, word("0x1"))
            self.assertEqual(raw.topics_json, "[\"" + DECISION_TOPIC + "\",\"" + word(SUBJECT) + "\",\"" + word("0x9") + "\",\"" + ACTION + "\"]")

    def test_atomic_one_shot_runner_commits_after_confirmed_scan(self) -> None:
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        transport = FakeTransport()
        client = JsonRpcClient(["http://rpc.test"], transport=transport, sleep=lambda _: None)
        runner = PersistentConfirmedScanOnce(
            client,
            chain_id=31337,
            contract_address=CONTRACT,
            confirmations=1,
            session_factory=sessionmaker(engine, expire_on_commit=False),
        )
        result = runner.run(10)
        self.assertEqual(result.projected_events, 1)
        with Session(engine) as session:
            self.assertEqual(session.query(CanonicalEventRecord).count(), 1)
            self.assertEqual(session.query(RawChainLogRecord).count(), 1)

    def test_atomic_one_shot_runner_rolls_back_unknown_event(self) -> None:
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        transport = FakeTransport()
        original = transport.__call__

        def unknown(endpoint, request, timeout):
            response = original(endpoint, request, timeout)
            if request["method"] == "eth_getLogs":
                response["result"][0]["topics"][0] = "0x" + "00" * 32
            return response

        client = JsonRpcClient(["http://rpc.test"], transport=unknown, sleep=lambda _: None)
        runner = PersistentConfirmedScanOnce(
            client,
            chain_id=31337,
            contract_address=CONTRACT,
            confirmations=1,
            session_factory=sessionmaker(engine, expire_on_commit=False),
        )
        with self.assertRaises(ValueError):
            runner.run(10)
        with Session(engine) as session:
            self.assertEqual(session.query(CanonicalEventRecord).count(), 0)
            self.assertEqual(session.query(RawChainLogRecord).count(), 0)

    def test_unknown_event_is_rejected_before_persistence(self) -> None:
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        transport = FakeTransport()
        original = transport.__call__

        def unknown(endpoint, request, timeout):
            response = original(endpoint, request, timeout)
            if request["method"] == "eth_getLogs":
                response["result"][0]["topics"][0] = "0x" + "00" * 32
            return response

        client = JsonRpcClient(["http://rpc.test"], transport=unknown, sleep=lambda _: None)
        with Session(engine) as session:
            scanner = PersistentConfirmedScanner(client, chain_id=31337, contract_address=CONTRACT, session=session, confirmations=1)
            with self.assertRaises(ValueError):
                scanner.scan(10)
            self.assertIsNone(session.scalar(select(CanonicalEventRecord)))
            self.assertIsNone(session.scalar(select(RawChainLogRecord)))


if __name__ == "__main__":
    unittest.main()
