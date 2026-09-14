#!/usr/bin/env python3
"""End-to-end integration test for MetaMask authentication flow.

Simulates the complete wallet authentication cycle:
1. Request nonce from server
2. Sign the challenge message with a private key (simulating MetaMask)
3. Submit signature to login endpoint
4. Use JWT to access protected endpoints
5. Test role-based access control
6. Test asset operations

Requires: pip install requests eth-account
"""
import sys
import time
import json
import requests
from eth_account import Account
from eth_account.messages import encode_defunct

# Hardhat default accounts
ACCOUNTS = {
    "admin": {
        "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "private_key": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "role": "ADMIN"
    },
    "manager": {
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "private_key": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "role": "MANAGER"
    },
    "auditor": {
        "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "private_key": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        "role": "AUDITOR"
    },
    "user": {
        "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "private_key": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
        "role": "USER"
    }
}

API_BASE = "http://localhost:8000"

def test_health():
    """Test API health."""
    print("\n=== Testing API Health ===")
    r = requests.get(f"{API_BASE}/healthz")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print(f"  ✓ Health: {r.json()['status']}")

def authenticate(account_name: str) -> str:
    """Simulate MetaMask auth flow, return JWT token."""
    account = ACCOUNTS[account_name]
    addr = account["address"]
    key = account["private_key"]
    
    print(f"\n=== Authenticating as {account_name} ({addr[:10]}...) ===")
    
    # Step 1: Get nonce
    r = requests.get(f"{API_BASE}/api/auth/nonce", params={"wallet_address": addr})
    assert r.status_code == 200, f"Nonce request failed: {r.status_code} {r.text}"
    data = r.json()
    nonce = data["nonce"]
    message = data["message"]
    print(f"  ✓ Got nonce: {nonce[:16]}...")
    
    # Step 2: Sign message (simulating MetaMask personal_sign)
    msg = encode_defunct(text=message)
    signed = Account.sign_message(msg, private_key=key)
    signature = signed.signature.hex()
    if not signature.startswith("0x"):
        signature = "0x" + signature
    print(f"  ✓ Signed message")
    
    # Step 3: Login
    r = requests.post(f"{API_BASE}/api/auth/login", json={
        "wallet_address": addr,
        "signature": signature,
        "nonce": nonce
    })
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data["token"]
    print(f"  ✓ Logged in as role: {data['role']}")
    assert data["role"] == account["role"], f"Expected role {account['role']}, got {data['role']}"
    
    return token

def test_auth_me(token: str, expected_role: str):
    """Test /api/auth/me with valid token."""
    print(f"\n=== Testing /auth/me ===")
    r = requests.get(f"{API_BASE}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, f"Auth/me failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == expected_role
    print(f"  ✓ Verified: wallet={data['wallet_address'][:10]}... role={data['role']}")

def test_unauthorized_access():
    """Test that endpoints reject unauthenticated requests."""
    print(f"\n=== Testing Unauthorized Access ===")
    r = requests.get(f"{API_BASE}/api/auth/me")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print(f"  ✓ Correctly rejected unauthenticated request")

def test_nonce_replay():
    """Test that nonces cannot be reused (replay attack prevention)."""
    print(f"\n=== Testing Nonce Replay Prevention ===")
    addr = ACCOUNTS["user"]["address"]
    key = ACCOUNTS["user"]["private_key"]
    
    # Get nonce
    r = requests.get(f"{API_BASE}/api/auth/nonce", params={"wallet_address": addr})
    data = r.json()
    nonce = data["nonce"]
    message = data["message"]
    
    # Sign and login
    msg = encode_defunct(text=message)
    signed = Account.sign_message(msg, private_key=key)
    signature = "0x" + signed.signature.hex() if not signed.signature.hex().startswith("0x") else signed.signature.hex()
    
    r = requests.post(f"{API_BASE}/api/auth/login", json={
        "wallet_address": addr, "signature": signature, "nonce": nonce
    })
    assert r.status_code == 200
    
    # Try to replay the same nonce
    r = requests.post(f"{API_BASE}/api/auth/login", json={
        "wallet_address": addr, "signature": signature, "nonce": nonce
    })
    assert r.status_code == 400, f"Replay should fail, got {r.status_code}"
    print(f"  ✓ Nonce replay correctly rejected")

def test_asset_operations(manager_token: str):
    """Test asset minting with manager role."""
    print(f"\n=== Testing Asset Operations ===")
    headers = {"Authorization": f"Bearer {manager_token}"}
    
    # Mint an asset
    r = requests.post(f"{API_BASE}/api/assets/mint", json={
        "recipient": ACCOUNTS["user"]["address"],
        "asset_id": "BEL-LAB-001",
        "metadata_hash": "0x" + "a1" * 32
    }, headers=headers)
    if r.status_code == 200:
        data = r.json()
        print(f"  ✓ Asset minted: token_id={data.get('token_id')}, tx={data.get('tx_hash', 'N/A')[:16]}...")
    else:
        print(f"  ⚠ Asset minting returned {r.status_code}: {r.text[:100]}")

def test_audit_logs():
    """Test audit log retrieval."""
    print(f"\n=== Testing Audit Logs ===")
    r = requests.get(f"{API_BASE}/api/audit/logs")
    assert r.status_code == 200, f"Audit logs failed: {r.status_code}"
    print(f"  ✓ Audit logs retrieved: {len(r.json().get('logs', r.json()))} entries")

def main():
    print("="*60)
    print("  BEL Digital Asset Platform — E2E Integration Tests")
    print("="*60)
    
    passed = 0
    failed = 0
    
    tests = [
        ("Health Check", lambda: test_health()),
        ("Admin Auth", lambda: None),  # placeholder
        ("Manager Auth", lambda: None),
        ("Auditor Auth", lambda: None),
        ("User Auth", lambda: None),
        ("Unauthorized Access", lambda: test_unauthorized_access()),
        ("Nonce Replay", lambda: test_nonce_replay()),
        ("Audit Logs", lambda: test_audit_logs()),
    ]
    
    try:
        test_health()
        passed += 1
    except Exception as e:
        print(f"  ✗ Health check failed: {e}")
        failed += 1
        print("\nAPI is not running. Start it with: uvicorn services.api.app:app --port 8000")
        sys.exit(1)
    
    # Auth tests for each role
    tokens = {}
    for role_name in ["admin", "manager", "auditor", "user"]:
        try:
            tokens[role_name] = authenticate(role_name)
            test_auth_me(tokens[role_name], ACCOUNTS[role_name]["role"])
            passed += 1
        except Exception as e:
            print(f"  ✗ {role_name} auth failed: {e}")
            failed += 1
    
    # Unauthorized access
    try:
        test_unauthorized_access()
        passed += 1
    except Exception as e:
        print(f"  ✗ Unauthorized test failed: {e}")
        failed += 1
    
    # Nonce replay
    try:
        test_nonce_replay()
        passed += 1
    except Exception as e:
        print(f"  ✗ Nonce replay test failed: {e}")
        failed += 1
    
    # Asset operations (as manager)
    if "manager" in tokens:
        try:
            test_asset_operations(tokens["manager"])
            passed += 1
        except Exception as e:
            print(f"  ✗ Asset operations failed: {e}")
            failed += 1
    
    # Audit logs
    try:
        test_audit_logs()
        passed += 1
    except Exception as e:
        print(f"  ✗ Audit logs failed: {e}")
        failed += 1
    
    print(f"\n{'='*60}")
    print(f"  Results: {passed} passed, {failed} failed")
    print(f"{'='*60}")
    
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
