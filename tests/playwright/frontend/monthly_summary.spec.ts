import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Monthly Summary View', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Monthly Summary
    await page.goto(`${baseURL}/dashboard/monthly`);
  });

  test('Should load Monthly Summary successfully and display all columns', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Monthly Summary (Aggregated)' })).toBeVisible();
    
    // Check table headers for new columns
    await expect(page.locator('th', { hasText: 'Investments' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Debt Paid' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Records' })).toBeVisible();
    
    // Check if at least one row is visible (if data exists)
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // Verify a specific month (e.g., January) has record count text if applicable
    const janRow = page.locator('tr', { hasText: 'January' });
    if (await janRow.isVisible()) {
      await expect(janRow.locator('td').last()).toContainText('txs');
    }
  });
});
