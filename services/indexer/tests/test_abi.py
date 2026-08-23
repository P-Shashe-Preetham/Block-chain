import unittest

from services.indexer.abi import AbiDecodeError, decode_secure_asset_log
from services.indexer.consumer import RawChainLog


CHAIN_ID = 31337
CONTRACT = "0x" + "ab" * 20
TX = "0x" + "cd" * 32
BLOCK_HASH = "0x" + "ef" * 32
SUBJECT = "0x" + "12" * 20
OWNER = "0x" + "34" * 20
ACTION = "0x" + "56" * 32


def word(value: str) -> str:
    return "0x" + value[2:].rjust(64, "0")


def address_topic(value: str) -> str:
    return word(value)


def uint_topic(value: int) -> str:
    return word(hex(value))


def bytes32_topic(value: str) -> str:
    return value


def log(topics: tuple[str, ...], data: str = "0x", address: str = CONTRACT) -> RawChainLog:
    return RawChainLog(42, BLOCK_HASH, TX, 3, address, topics, data)


class SecureAssetAbiDecoderTests(unittest.TestCase):
    def test_decodes_access_decision_with_indexed_and_data_fields(self):
        event = decode_secure_asset_log(
            log((
                "0x94312429f260fe5dbea4725e0cbd9b951191f77a6d0dc08f455c2298b7442256",
                address_topic(SUBJECT),
                uint_topic(9),
                bytes32_topic(ACTION),
            ), word("0x1")),
            chain_id=CHAIN_ID,
            contract_address=CONTRACT,
        )
        self.assertEqual(event.name, "AccessDecision")
        self.assertEqual(event.key.chain_id, CHAIN_ID)
        self.assertEqual(event.payload, (
            ("requester", SUBJECT.lower()),
            ("tokenId", "9"),
            ("action", ACTION.lower()),
            ("granted", "true"),
        ))

    def test_decodes_access_rule_set_and_normalizes_non_indexed_address(self):
        event = decode_secure_asset_log(
            log((
                "0x3b4ab6be9b7d284cf5de5eb7ca44dcc2ba048759cbb6a726491cc52b70d620fb",
                uint_topic(9),
                bytes32_topic(ACTION),
                address_topic(SUBJECT),
            ), "0x" + "1".zfill(64) + "2a".zfill(64) + OWNER[2:].rjust(64, "0")),
            chain_id=CHAIN_ID,
            contract_address=CONTRACT.upper().replace("0X", "0x"),
            event_version=2,
        )
        self.assertEqual(event.name, "AccessRuleSet")
        self.assertEqual(event.key.event_version, 2)
        self.assertEqual(event.payload[-3:], (("allowed", "true"), ("expiresAt", "42"), ("actor", OWNER.lower())))

    def test_decodes_inherited_transfer_event(self):
        event = decode_secure_asset_log(
            log((
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                address_topic("0x" + "00" * 20),
                address_topic(OWNER),
                uint_topic(9),
            )),
            chain_id=CHAIN_ID,
            contract_address=CONTRACT,
        )
        self.assertEqual(event.name, "Transfer")
        self.assertEqual(event.payload[0], ("from", "0x" + "00" * 20))

    def test_rejects_unknown_signature_and_wrong_contract(self):
        with self.assertRaises(AbiDecodeError):
            decode_secure_asset_log(log(("0x" + "00" * 32,)), chain_id=CHAIN_ID, contract_address=CONTRACT)
        with self.assertRaises(AbiDecodeError):
            decode_secure_asset_log(log(("0x94312429f260fe5dbea4725e0cbd9b951191f77a6d0dc08f455c2298b7442256",), address="0x" + "99" * 20), chain_id=CHAIN_ID, contract_address=CONTRACT)

    def test_rejects_wrong_topic_count_data_shape_and_noncanonical_boolean(self):
        decision = "0x94312429f260fe5dbea4725e0cbd9b951191f77a6d0dc08f455c2298b7442256"
        with self.assertRaises(AbiDecodeError):
            decode_secure_asset_log(log((decision, address_topic(SUBJECT))), chain_id=CHAIN_ID, contract_address=CONTRACT)
        with self.assertRaises(AbiDecodeError):
            decode_secure_asset_log(log((decision, address_topic(SUBJECT), uint_topic(9), bytes32_topic(ACTION)), "0x"), chain_id=CHAIN_ID, contract_address=CONTRACT)
        with self.assertRaises(AbiDecodeError):
            decode_secure_asset_log(log((decision, address_topic(SUBJECT), uint_topic(9), bytes32_topic(ACTION)), word("0x2")), chain_id=CHAIN_ID, contract_address=CONTRACT)


if __name__ == "__main__":
    unittest.main()
