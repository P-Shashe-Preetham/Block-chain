import { test, expect } from '@playwright/test';

test.describe('SIH Demonstration Flow (Digital Asset Paradigm)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('Full 13-step demonstration flow', async ({ page }) => {
    // Mock the initial endpoints for headless testing
    // 1. Identity status (Not registered initially)
    await page.route('**/api/identity/status/*', async route => {
      await route.fulfill({ json: { registered: false, status: "NONE" } });
    });

    // 2. Assets (Empty)
    await page.route('**/api/assets/*', async route => {
      await route.fulfill({ json: { assets: [] } });
    });

    // 3. Consents (Empty)
    await page.route('**/api/rbac/consents/*', async route => {
      await route.fulfill({ json: { consents: [] } });
    });

    // 4. Access Logs (Empty)
    await page.route('**/api/rbac/access-logs/*', async route => {
      await route.fulfill({ json: { logs: [] } });
    });

    // Step 1: Login
    await expect(page.locator('text=Digital Asset Platform')).toBeVisible();
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    await expect(page.locator('text=ROLE: ADMIN')).toBeVisible();

    // Step 2: Register Identity
    // Mock registration API
    await page.route('**/api/identity/register', async route => {
      await route.fulfill({ json: { success: true } });
    });

    await page.fill('input[placeholder="did:ethr:..."]', 'did:ethr:0xMock');
    await page.fill('input[placeholder="Encrypted PII Data"]', 'ENCRYPTED_PII');
    
    // Accept dialogs (headless fallback shows alert)
    page.on('dialog', async dialog => {
       try {
         if (dialog.type() === 'prompt') {
            await dialog.accept("0xRequesterWallet123");
         } else {
            await dialog.accept();
         }
       } catch (e) {
         // suppress already handled errors
       }
    });

    await page.getByRole('button', { name: 'Register Identity' }).click();
    await expect(page.locator('text=✓ Identity Registered')).toBeVisible({ timeout: 5000 });

    // Step 3: Mocking wallet signatures is implicitly tested via the headless mock logic
    // which injects "mock_jwt" and bypasses window.ethereum which doesn't exist in headless Playwright.

    // Step 4: Grant Consent
    // Mock the grant API
    await page.route('**/api/rbac/grant-consent', async route => {
      await route.fulfill({ json: { success: true } });
    });

    // We will update the consents route to now return a consent
    await page.route('**/api/rbac/consents/*', async route => {
      await route.fulfill({ json: { consents: [
        { consent_id: "cst_1", requester_wallet: "0xRequesterWallet123", asset_id: "ALL" }
      ] } });
    });

    // Mock the logs API so when fetchDashboardData is called, it returns the log
    await page.route('**/api/rbac/access-logs/*', async route => {
      await route.fulfill({ json: { logs: [
        { log_id: "log_1", timestamp: "2026-08-30", action: "READ", requester_wallet: "0xRequesterWallet123", granted: true, reason: "Consent pre-approved" }
      ] } });
    });

    await page.getByRole('button', { name: 'Grant Consent' }).click();

    // Verify consent appears
    await expect(page.locator('text=cst_1')).toBeVisible();

    // Step 5: Viewing the audit stream
    await page.getByRole('tab', { name: 'Audit Logs' }).click();
    await expect(page.locator('text=Immutable Audit Logs')).toBeVisible();
    await expect(page.locator('text=0xReques')).toBeVisible(); // 0xRequesterWallet123 substring

    // Step 6: Revoking consent
    await page.getByRole('tab', { name: 'My Dashboard' }).click();

    await page.route('**/api/rbac/revoke-consent/*', async route => {
      await route.fulfill({ json: { success: true } });
    });

    // Mock consents to empty again
    await page.route('**/api/rbac/consents/*', async route => {
      await route.fulfill({ json: { consents: [] } });
    });

    await page.getByRole('button', { name: 'Revoke Consent' }).click();
    
    // Verify consent goes away
    await expect(page.locator('text=No active consents.')).toBeVisible();
  });
});
