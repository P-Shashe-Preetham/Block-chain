
import requests
from eth_account import Account
from eth_account.messages import encode_defunct

account_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

print("1. Requesting nonce through Web Port 3000...")
r = requests.get(f"http://localhost:3000/api/auth/nonce?wallet_address={account_address}")
print("Status:", r.status_code, "Content-Type:", r.headers.get("content-type"))
data = r.json()
nonce = data["nonce"]
message = data["message"]
print("Got nonce:", nonce[:10])

print("2. Signing message...")
msg = encode_defunct(text=message)
signed = Account.sign_message(msg, private_key=private_key)
sig = signed.signature.hex()
if not sig.startswith("0x"): sig = "0x" + sig

print("3. Logging in through Web Port 3000...")
r = requests.post("http://localhost:3000/api/auth/login", json={
    "wallet_address": account_address,
    "signature": sig,
    "nonce": nonce
})
print("Login status:", r.status_code, "Content-Type:", r.headers.get("content-type"))
print("Login Response:", r.json())

