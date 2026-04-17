import { test, expect } from '@playwright/test';

// Use 127.0.0.1 instead of localhost for IPv6 compatibility issues
const baseURL = 'http://127.0.0.1:3000';

test.describe('Assets Management CRUD Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);

    // Navigate to Assets page
    await page.click('a:has-text("Assets")');
    await expect(page).toHaveURL(`${baseURL}/dashboard/assets`);
    await expect(page.locator('h1', { hasText: 'Assets Management' })).toBeVisible();

    // Handle all dialogs globally (for delete confirmation)
    page.on('dialog', dialog => dialog.accept());
  });

  const uniqueStamp = Date.now().toString().slice(-6);
  const savingAccName = `Test Saving Track ${uniqueStamp}`;
  const investAccName = `Test Invest Track ${uniqueStamp}`;

  test('Should display Assets summary cards and table', async ({ page }) => {
    // Verify summary cards are visible (wait for data to load)
    await expect(page.locator('text=Total Assets')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Asset Entries').first()).toBeVisible();

    // Verify Add Asset button
    await expect(page.locator('#btn-add-asset')).toBeVisible();
  });

  test('Should perform full CRUD on a Saving asset record', async ({ page }) => {
    // 1. Create a SAVING Record via "Create New Account"
    await page.click('#btn-add-asset');
    // The header might be "Add Asset Value" or "Add Asset Record"
    await expect(page.locator('h2', { hasText: /Add Asset/i })).toBeVisible();

    const accountSelect = page.locator('select').first();
    await accountSelect.selectOption('new');

    await page.getByPlaceholder('e.g. ออมสิน บัญชีเงินซื้อรถ').fill(savingAccName);
    
    const newAccSection = page.locator('.space-y-4.p-4');
    await newAccSection.locator('select').first().selectOption('SAVING');
    
    const instSelect = newAccSection.locator('select').last();
    const options = await instSelect.locator('option').all();
    if (options.length > 1) {
      await instSelect.selectOption({ index: 1 });
    }

    await page.fill('#input-asset-amount', '5000');
    await page.locator('label:has-text("As of Date") + input').fill('2026-04-10');

    const savePromise = page.waitForResponse(res => res.url().includes('/api/v1/financial-records') && res.status() === 201);
    await page.click('#btn-save-asset');
    await savePromise;
    await page.waitForTimeout(500);

    await expect(page.locator('text=Asset record added successfully')).toBeVisible();

    const row = page.locator('tr').filter({ hasText: savingAccName }).first();
    await expect(row).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '฿5,000.00' })).toBeVisible();

    // 2. Edit
    await row.locator('button[title="Edit"]').click();
    await expect(page.locator('h2', { hasText: /Edit Asset/i })).toBeVisible();
    await page.fill('#input-asset-amount', '8000');
    await page.locator('label:has-text("As of Date") + input').fill('2026-04-12');

    await page.click('#btn-save-asset');
    await expect(page.locator('text=Asset record updated successfully')).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '฿8,000.00' })).toBeVisible();

    // 3. Delete
    await row.locator('button[title="Delete"]').click();
    await expect(page.getByText('Asset record removed successfully')).toBeVisible();
    await expect(row).not.toBeVisible();
  });

  test('Should log another record for an existing asset account', async ({ page }) => {
    // 1. Create initial new account (Investment)
    await page.click('#btn-add-asset');
    const accountSelect = page.locator('select').first();
    await accountSelect.selectOption('new');
    await page.getByPlaceholder('e.g. ออมสิน บัญชีเงินซื้อรถ').fill(investAccName);
    
    const newAccSection = page.locator('.space-y-4.p-4');
    await newAccSection.locator('select').first().selectOption('INVESTMENT');
    
    await page.fill('#input-asset-amount', '25000');
    
    const savePromise1 = page.waitForResponse(res => res.url().includes('/api/v1/financial-records') && res.status() === 201);
    await page.click('#btn-save-asset');
    const response1 = await savePromise1;
    const { record } = await response1.json();
    const accountId = record.accountId;
    
    await page.waitForTimeout(500);
    await expect(page.locator('text=Asset record added successfully')).toBeVisible();

    const row = page.locator('tr').filter({ hasText: investAccName }).first();
    await expect(row).toBeVisible();

    // 2. Add a second record for the SAME account
    await page.waitForTimeout(1000); 
    await page.click('#btn-add-asset');
    
    await accountSelect.selectOption(accountId);
    await expect(page.getByPlaceholder('e.g. ออมสิน บัญชีเงินซื้อรถ')).not.toBeVisible();

    await page.fill('#input-asset-amount', '35000');
    await page.locator('label:has-text("As of Date") + input').fill('2026-05-01');
    
    const savePromise2 = page.waitForResponse(res => res.url().includes('/api/v1/financial-records') && res.status() === 201);
    await page.click('#btn-save-asset');
    await savePromise2;
    await expect(page.locator('text=Asset record added successfully')).toBeVisible();

    // 3. Verify that the record is UPDATED (not duplicated) in this view
    const rows = page.locator('tr').filter({ hasText: investAccName });
    await expect(rows).toHaveCount(1);
    await expect(rows.locator('td').filter({ hasText: '฿35,000.00' })).toBeVisible();
  });
});
