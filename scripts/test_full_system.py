"""Full System Integration Test Script.

Validates that both the FastAPI Backend API (Port 8000) and Vite Web Console Frontend (Port 3000)
are running, reachable, and fully connected over HTTP proxy.
"""

from __future__ import annotations

import json
import sys
import urllib.request


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def print_result(name: str, success: bool, details: str):
    status = "[PASS]" if success else "[FAIL]"
    print(f" {status} {name}: {details}")


def test_system():
    print("\n" + "=" * 75)
    print(" >>> FULL PLATFORM CONNECTIVITY & INTEGRATION VERIFICATION")
    print("=" * 75)

    all_passed = True

    # 1. Test Backend Health Endpoint
    try:
        req = urllib.request.urlopen("http://localhost:8000/healthz", timeout=3)
        data = json.loads(req.read().decode())
        success = data.get("status") == "ok"
        print_result("1. FastAPI Core Health (/healthz)", success, f"Response: {data}")
    except Exception as e:
        success = False
        print_result("1. FastAPI Core Health (/healthz)", False, f"Error: {e}")
    all_passed = all_passed and success

    # 2. Test Algorand Service Health Endpoint
    try:
        req = urllib.request.urlopen("http://localhost:8000/v1/algorand/health", timeout=10)
        data = json.loads(req.read().decode())
        success = "algod_online" in data
        print_result("2. Algorand Health API (/v1/algorand/health)", success, f"Response: {data}")
    except Exception as e:
        success = False
        print_result("2. Algorand Health API (/v1/algorand/health)", False, f"Error: {e}")
    all_passed = all_passed and success

    # 3. Test Algorand Account Generation Endpoint
    try:
        req = urllib.request.Request(
            "http://localhost:8000/v1/algorand/accounts/generate",
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req, timeout=3)
        data = json.loads(resp.read().decode())
        success = "address" in data and len(data["address"]) == 58
        print_result("3. Keypair API (/v1/algorand/accounts/generate)", success, f"Generated: {data['address'][:12]}...")
    except Exception as e:
        success = False
        print_result("3. Keypair API (/v1/algorand/accounts/generate)", False, f"Error: {e}")
    all_passed = all_passed and success

    # 4. Test Algorand On-Chain Access Request Endpoint
    try:
        payload = json.dumps({"asset_id": 1048576, "action": "READ_ENCRYPTED_PAYLOAD"}).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:8000/v1/algorand/assets/request-access",
            data=payload,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req, timeout=3)
        data = json.loads(resp.read().decode())
        success = data.get("decision") == "GRANTED" and "proof" in data
        print_result("4. Access Decision API (/v1/algorand/assets/request-access)", success, f"Decision: {data['decision']} | Log: {data['proof']['on_chain_log']}")
    except Exception as e:
        success = False
        print_result("4. Access Decision API (/v1/algorand/assets/request-access)", False, f"Error: {e}")
    all_passed = all_passed and success

    # 5. Test Frontend Dev Server HTML Response
    try:
        req = urllib.request.urlopen("http://localhost:3000/", timeout=3)
        html = req.read().decode()
        success = "<title>Blockchain Secure Platform" in html or '<div id="root">' in html
        print_result("5. Frontend Web Console (http://localhost:3000/)", success, f"Status: {req.status} OK | Root div verified")
    except Exception as e:
        success = False
        print_result("5. Frontend Web Console (http://localhost:3000/)", False, f"Error: {e}")
    all_passed = all_passed and success

    # 6. Test Frontend API Proxy Route
    try:
        req = urllib.request.urlopen("http://localhost:3000/healthz", timeout=3)
        data = json.loads(req.read().decode())
        success = data.get("status") == "ok"
        print_result("6. Frontend -> Backend Proxy (http://localhost:3000/healthz)", success, f"Proxied Response: {data}")
    except Exception as e:
        success = False
        print_result("6. Frontend -> Backend Proxy (http://localhost:3000/healthz)", False, f"Error: {e}")
    all_passed = all_passed and success

    print("=" * 75)
    if all_passed:
        print(" SUCCESS: ALL 6 SYSTEM INTEGRATION TESTS PASSED PERFECTLY!")
        print(" EVERYTHING IS CONNECTED & OPERATIONAL!")
    else:
        print(" WARNING: SOME INTEGRATION TESTS FAILED.")
    print("=" * 75 + "\n")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(test_system())
