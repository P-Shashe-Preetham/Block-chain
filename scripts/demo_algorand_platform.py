"""End-to-End Live Demonstration of Algorand Secure Platform.

Runs live operations: Identity Registration, AES-256-GCM Payload Encryption,
ASA Digital Asset Minting, On-Chain Access Control Evaluation, and Indexer Projection.
"""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from services.api.app import create_app, load_settings
from services.indexer.algorand_consumer import AlgorandIndexerConsumer, AlgorandLogDecoder
from services.storage.crypto import encrypt


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def print_banner(title: str):
    print("\n" + "=" * 70)
    print(f" >>> {title}")
    print("=" * 70)


def run_live_demo():
    print_banner("ALGORAND BLOCKCHAIN SECURE PLATFORM - LIVE DEMO")

    # 1. Initialize FastAPI Application & TestClient
    app = create_app(load_settings())
    client = TestClient(app)

    # 2. Health & Readiness Check
    print_banner("1. SYSTEM HEALTH & ALGORAND CLIENT STATUS")
    health = client.get("/healthz").json()
    algo_health = client.get("/v1/algorand/health").json()
    print(f"[+] FastAPI Health Status : {health}")
    print(f"[+] Algorand Node Health  : {algo_health}")

    # 3. Keypair Generation & DID Registration
    print_banner("2. ALGORAND KEYPAIR & DID IDENTITY REGISTRATION")
    account = client.post("/v1/algorand/accounts/generate").json()
    print(f"[+] Generated Address   : {account['address']}")
    print(f"[+] Generated Mnemonic  : {account['mnemonic'][:40]}... [REDACTED]")

    did_payload = {
        "subject_did": "did:algo:subject001",
        "public_key": account["address"],
    }
    did_res = client.post("/v1/algorand/identities/register", json=did_payload).json()
    print(f"[+] DID Registration Res : {json.dumps(did_res, indent=2)}")

    # 4. Off-Chain AES-256 Payload Encryption & ASA Asset Minting
    print_banner("3. AES-256-GCM PAYLOAD ENCRYPTION & ASA NFT MINTING")
    mint_payload = {
        "asset_name": "Medical Record #001",
        "unit_name": "MED1",
        "payload_content": "CONFIDENTIAL: Patient Medical Identity & Health Record",
        "encryption_key_hex": "01" * 32,
    }
    mint_res = client.post("/v1/algorand/assets/mint", json=mint_payload).json()
    print(f"[+] ASA Asset ID         : {mint_res['asa_asset_id']}")
    print(f"[+] SHA-256 Payload Hash : {mint_res['payload_hash_sha256']}")
    print(f"[+] AES-256 Envelope     : {json.dumps(mint_res['encrypted_envelope'], indent=2)}")

    # 5. On-Chain Access Request Evaluation
    print_banner("4. ON-CHAIN ACCESS CONTROL EVALUATION (PyTeal Contract)")
    access_payload = {
        "asset_id": mint_res["asa_asset_id"],
        "action": "READ_ENCRYPTED_PAYLOAD",
    }
    access_res = client.post("/v1/algorand/assets/request-access", json=access_payload).json()
    print(f"[+] Decision Output      : {json.dumps(access_res, indent=2)}")

    # 6. Indexer Log Consumption & Database Projection
    print_banner("5. ALGORAND INDEXER LOG DECODER & CANONICAL PROJECTION")
    raw_log = access_res["proof"]["on_chain_log"]
    b64_log = base64.b64encode(raw_log.encode("utf-8")).decode("ascii")

    mock_indexer_tx = {
        "id": access_res["tx_id"],
        "confirmed-round": access_res["proof"]["block_round"],
        "application-transaction": {"application-id": 1003},
        "logs": [b64_log],
    }

    consumer = AlgorandIndexerConsumer()
    canonical_record = consumer.parse_transaction_to_canonical_record(mock_indexer_tx)

    print(f"[+] Decoded Log Event    : {AlgorandLogDecoder.decode_log(b64_log)}")
    print(f"[+] Canonical DB Record  : ID={canonical_record.id}")
    print(f"                           TxHash={canonical_record.transaction_hash}")
    print(f"                           Event={canonical_record.event_name}")
    print(f"                           Status={canonical_record.projection_status}")

    print_banner("LIVE DEMONSTRATION COMPLETE - ALL SYSTEMS OPERATIONAL ✅")


if __name__ == "__main__":
    run_live_demo()
