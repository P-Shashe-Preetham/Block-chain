import { test, expect } from '@playwright/test';

test.describe('BEL Asset Platform E2E', () => {
  // Use a simulated headless login for Playwright tests
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Connect wallet should appear
    await expect(page.locator('text=Digital Asset Platform')).toBeVisible();
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    
    // After headless login, the role dashboard should show up
    await expect(page.locator('text=ROLE: ADMIN')).toBeVisible();
  });

  test('Admin can mint an asset', async ({ page }) => {
    // Mock the mint API call
    await page.route('**/api/assets/mint', async route => {
      const json = { success: true, asset: { asset_id: "1", name: "Test Document" } };
      await route.fulfill({ json });
    });

    // Mock the get assets API call
    await page.route('**/api/assets/*', async route => {
      const json = { assets: [{ asset_id: "1", name: "Test Document", asset_type: "SENSITIVE", ipfs_cid: "Qm123" }] };
      await route.fulfill({ json });
    });

    // Navigate to Mint tab
    await page.getByRole('tab', { name: 'Mint Asset' }).click();
    
    // Fill form
    await page.fill('input#name', 'Test Document');
    await page.fill('input#desc', 'Confidential Design Spec');
    await page.fill('input#type', 'SENSITIVE_DOCUMENT');
    await page.fill('input#ipfs', 'QmTestHash123');
    
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: 'Mint & Broadcast' }).click();
    
    // Go back to dashboard to see if it's there
    await page.getByRole('tab', { name: 'My Dashboard' }).click();
    
    // Trigger the fetch explicitly or rely on state update.
    // In our component, handleMintAsset calls fetchDashboardData which we mocked.
    await expect(page.locator('text=Test Document')).toBeVisible({ timeout: 5000 });
  });

  test('Auditor can view access logs', async ({ page }) => {
    // Mock the logs API call
    await page.route('**/api/rbac/access-logs/*', async route => {
      const json = { logs: [{ log_id: "1", timestamp: "2026-08-30", action: "READ", requester_wallet: "0xMock", granted: true }] };
      await route.fulfill({ json });
    });

    // Navigate to Audit tab
    await page.getByRole('tab', { name: 'Audit Logs' }).click();
    
    // Check if table is visible
    await expect(page.locator('text=Immutable Audit Logs')).toBeVisible();
    
    // We expect the table headers to be there
    await expect(page.locator('text=Requester')).toBeVisible();
  });
});
