"""Strict decoder for the compiled SecureAssetPlatform event ABI.

The decoder is intentionally read-only and dependency-free. Topic hashes and
field layouts are copied from the generated Hardhat ABI during development and
covered by fixtures; the contract source and compiled ABI remain authoritative.
Unknown events and malformed logs are rejected rather than projected.
"""

from __future__ import annotations

from dataclasses import dataclass

from .projector import CanonicalEvent, EventKey
from .consumer import RawChainLog


class AbiDecodeError(ValueError):
    """Raised when a log cannot be proven to match the approved event ABI."""


@dataclass(frozen=True)
class _Field:
    name: str
    abi_type: str
    indexed: bool


@dataclass(frozen=True)
class _EventSpec:
    name: str
    topic: str
    fields: tuple[_Field, ...]


# Topic hashes are generated from the compiled contract ABI. The inherited
# OpenZeppelin events are included because they are emitted by this contract's
# public ERC-721 and AccessControl surface.
_SPECS = (
    _EventSpec("AccessDecision", "0x94312429f260fe5dbea4725e0cbd9b951191f77a6d0dc08f455c2298b7442256", (
        _Field("requester", "address", True), _Field("tokenId", "uint256", True), _Field("action", "bytes32", True), _Field("granted", "bool", False),
    )),
    _EventSpec("AccessRuleSet", "0x3b4ab6be9b7d284cf5de5eb7ca44dcc2ba048759cbb6a726491cc52b70d620fb", (
        _Field("tokenId", "uint256", True), _Field("action", "bytes32", True), _Field("requester", "address", True), _Field("allowed", "bool", False), _Field("expiresAt", "uint64", False), _Field("actor", "address", False),
    )),
    _EventSpec("Approval", "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", (
        _Field("owner", "address", True), _Field("approved", "address", True), _Field("tokenId", "uint256", True),
    )),
    _EventSpec("ApprovalForAll", "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31", (
        _Field("owner", "address", True), _Field("operator", "address", True), _Field("approved", "bool", False),
    )),
    _EventSpec("AssetMintedAndAllocated", "0x91867a1b7f2f56edd0a567161e5afa13b52888641c804cb3863eb43d180107cb", (
        _Field("tokenId", "uint256", True), _Field("owner", "address", True), _Field("assetId", "bytes32", True), _Field("metadataHash", "bytes32", False),
    )),
    _EventSpec("AssetStatusChanged", "0x9386daf266029c56017df27d0827d3635a1423608822b59fd5e0fe3bb72b0e50", (
        _Field("tokenId", "uint256", True), _Field("status", "uint8", False), _Field("actor", "address", True),
    )),
    _EventSpec("EmergencyStateChanged", "0x9ff55b2c2cd39ce39fc122ab9119a05d0f3d8d94b35ec69df732cb566b1fc070", (
        _Field("paused", "bool", False),
    )),
    _EventSpec("IdentityKeyReplaced", "0x1fea1dd22edb774a8aa7b1252b8c6376b1307ebf761147111591064d6385ca89", (
        _Field("oldSubject", "address", True), _Field("newSubject", "address", True), _Field("newDidHash", "bytes32", True),
    )),
    _EventSpec("IdentityOffboarded", "0x6aa405f69eb282372189d089ec26622c3d028747682dae0ec30ae2c76aef275b", (
        _Field("subject", "address", True), _Field("reason", "bytes32", True),
    )),
    _EventSpec("IdentityRegistered", "0x209ae2eb4ff1890ce972a80ec3e167b52d41ab089135cc6430447b1430e824be", (
        _Field("subject", "address", True), _Field("didHash", "bytes32", True),
    )),
    _EventSpec("IdentityStatusChanged", "0x4441c59c6c1b36498a0353d4ce9279a1ec9f94cafa52b52f5a5c8f30903e064a", (
        _Field("subject", "address", True), _Field("isActive", "bool", False),
    )),
    _EventSpec("Paused", "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258", (
        _Field("account", "address", False),
    )),
    _EventSpec("RoleAdminChanged", "0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff", (
        _Field("role", "bytes32", True), _Field("previousAdminRole", "bytes32", True), _Field("newAdminRole", "bytes32", True),
    )),
    _EventSpec("RoleGranted", "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d", (
        _Field("role", "bytes32", True), _Field("account", "address", True), _Field("sender", "address", True),
    )),
    _EventSpec("RoleRevoked", "0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b", (
        _Field("role", "bytes32", True), _Field("account", "address", True), _Field("sender", "address", True),
    )),
    _EventSpec("Transfer", "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", (
        _Field("from", "address", True), _Field("to", "address", True), _Field("tokenId", "uint256", True),
    )),
    _EventSpec("Unpaused", "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa", (
        _Field("account", "address", False),
    )),
)

_SPECS_BY_TOPIC = {spec.topic: spec for spec in _SPECS}


def decode_secure_asset_log(log: RawChainLog, *, chain_id: int, contract_address: str, event_version: int = 1) -> CanonicalEvent:
    """Decode one log from the approved contract ABI into a canonical event."""
    if chain_id < 1 or event_version < 1:
        raise AbiDecodeError("chain ID and event version must be positive")
    if _normalize_address(log.address) != _normalize_address(contract_address):
        raise AbiDecodeError("log address does not match the configured contract")
    if _normalize_address(contract_address) is None:
        raise AbiDecodeError("contract address is invalid")
    if not isinstance(log.transaction_hash, str) or not log.transaction_hash.startswith("0x") or len(log.transaction_hash) != 66:
        raise AbiDecodeError("transaction hash is invalid")
    if not isinstance(log.topics, tuple) or not log.topics:
        raise AbiDecodeError("event topics are missing")
    topic0 = _normalize_word(log.topics[0], "event signature")
    spec = _SPECS_BY_TOPIC.get(topic0)
    if spec is None:
        raise AbiDecodeError("event signature is not in the approved ABI")
    indexed_fields = tuple(field for field in spec.fields if field.indexed)
    data_fields = tuple(field for field in spec.fields if not field.indexed)
    if len(log.topics) != 1 + len(indexed_fields):
        raise AbiDecodeError("event topic count does not match the approved ABI")
    data_words = _data_words(log.data)
    if len(data_words) != len(data_fields):
        raise AbiDecodeError("event data length does not match the approved ABI")

    indexed_values = iter(log.topics[1:])
    data_values = iter(data_words)
    payload: list[tuple[str, str]] = []
    for field in spec.fields:
        raw = next(indexed_values) if field.indexed else next(data_values)
        payload.append((field.name, _decode_word(raw, field.abi_type)))
    return CanonicalEvent(
        key=EventKey(chain_id, _normalize_address(contract_address) or contract_address.lower(), log.transaction_hash.lower(), log.log_index, event_version),
        block_number=log.block_number,
        block_hash=log.block_hash,
        name=spec.name,
        payload=tuple(payload),
    )


def _data_words(data: str) -> tuple[str, ...]:
    if not isinstance(data, str) or not data.startswith("0x") or len(data[2:]) % 64 != 0:
        raise AbiDecodeError("event data must contain complete ABI words")
    if any(character not in "0123456789abcdefABCDEF" for character in data[2:]):
        raise AbiDecodeError("event data contains non-hex characters")
    return tuple("0x" + data[2 + offset: 2 + offset + 64] for offset in range(0, len(data[2:]), 64))


def _normalize_word(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.startswith("0x") or len(value) != 66:
        raise AbiDecodeError(f"{field} must be a 32-byte hex word")
    if any(character not in "0123456789abcdefABCDEF" for character in value[2:]):
        raise AbiDecodeError(f"{field} contains non-hex characters")
    return value.lower()


def _decode_word(value: str, abi_type: str) -> str:
    word = _normalize_word(value, abi_type)
    raw = word[2:]
    if abi_type == "address":
        if raw[:24] != "0" * 24:
            raise AbiDecodeError("ABI address word is not left-padded")
        return "0x" + raw[24:]
    if abi_type == "bytes32":
        return word
    number = int(raw, 16)
    if abi_type == "bool":
        if number not in (0, 1):
            raise AbiDecodeError("ABI bool word is not canonical")
        return "true" if number else "false"
    if abi_type == "uint8" and number > 0xFF:
        raise AbiDecodeError("uint8 value overflows")
    if abi_type == "uint64" and number > 0xFFFFFFFFFFFFFFFF:
        raise AbiDecodeError("uint64 value overflows")
    if abi_type in {"uint8", "uint64", "uint256"}:
        return str(number)
    raise AbiDecodeError(f"unsupported ABI type: {abi_type}")


def _normalize_address(value: object) -> str | None:
    if not isinstance(value, str) or not value.startswith("0x") or len(value) != 42:
        return None
    if any(character not in "0123456789abcdefABCDEF" for character in value[2:]):
        return None
    return value.lower()
