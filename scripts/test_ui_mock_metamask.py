
import time
from playwright.sync_api import sync_playwright

account_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    
    # Inject Mock MetaMask Provider
    def sign_message_py(msg_text):
        from eth_account import Account
        from eth_account.messages import encode_defunct
        if isinstance(msg_text, str) and msg_text.startswith("0x"):
            # ethers personal_sign passes hex
            try:
                msg_text = bytes.fromhex(msg_text[2:]).decode('utf-8')
            except:
                pass
        msg = encode_defunct(text=msg_text)
        priv_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        signed = Account.sign_message(msg, private_key=priv_key)
        sig = signed.signature.hex()
        return "0x" + sig if not sig.startswith("0x") else sig

    page.expose_function("__signPersonalMessage", sign_message_py)
    page.add_init_script("""
        window.ethereum = {
            isMetaMask: true,
            chainId: "0x7a69", // 31337
            selectedAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            request: async ({ method, params }) => {
                if (method === "eth_requestAccounts" || method === "eth_accounts") {
                    return ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"];
                }
                if (method === "eth_chainId") {
                    return "0x7a69";
                }
                if (method === "personal_sign" || method === "eth_sign") {
                    // Sign with Hardhat Account #0 private key
                    const messageHex = params[0];
                    return window.__signPersonalMessage(messageHex);
                }
                return null;
            },
            send: async (method, params) => {
                if (method === "eth_requestAccounts" || method === "eth_accounts") {
                    return ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"];
                }
                if (method === "eth_chainId") {
                    return "0x7a69";
                }
                return null;
            },
            on: () => {},
            removeListener: () => {}
        };
    """)
    
    # Track network responses
    responses = []
    def on_resp(r):
        ct = r.headers.get("content-type", "")
        responses.append(f"{r.status} {r.url} ({ct})")
    page.on("response", on_resp)
    
    print("Navigating to http://127.0.0.1:3000/login...")
    page.goto("http://127.0.0.1:3000/login")
    page.wait_for_timeout(1500)
    
    print("Clicking Connect MetaMask Wallet button...")
    page.click("button:has-text(\"Connect MetaMask Wallet\")")
    page.wait_for_timeout(2000)
    
    print("Network Responses:")
    for r in responses:
        if "/api/" in r:
            print("  ->", r)
            
    # Check if there is an error banner
    errors = page.locator(".text-red-400, .bg-red-950\\/40").all_text_contents()
    print("UI Errors Found:", errors)
    
    browser.close()

with sync_playwright() as playwright:
    run(playwright)

