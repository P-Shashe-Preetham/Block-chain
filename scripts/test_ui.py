
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/login")
    page.wait_for_timeout(1000)
    print("Page Title:", page.title())
    print("Page Content Snippet:", page.inner_text("body")[:300])
    
    # Check if Connect button is visible
    btn = page.locator("button:has-text('Connect MetaMask Wallet')")
    print("Connect Wallet Button Count:", btn.count())
    if btn.count() > 0:
        print("Connect Wallet button is visible:", btn.is_visible())
    
    browser.close()

with sync_playwright() as playwright:
    run(playwright)

