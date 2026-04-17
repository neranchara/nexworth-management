import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Liabilities Management CRUD Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);

    // Navigate to Liabilities
    await page.click('a:has-text("Liabilities")');
    await expect(page).toHaveURL(`${baseURL}/dashboard/liabilities`);
    await expect(page.locator('h1', { hasText: 'Liabilities Management' })).toBeVisible();

    // Handle all dialogs globally (for delete confirmation)
    page.on('dialog', dialog => dialog.accept());
  });

  const uniqueStamp = Date.now().toString().slice(-6);
  const liabilityName = `Test Liability Track ${uniqueStamp}`;
  const liabilityName2 = `Test Loan Track ${uniqueStamp}`;

  test('Should display Liabilities summary cards and table', async ({ page }) => {
    // Wait for the main container to ensure navigation completed
    await expect(page.locator('h1', { hasText: 'Liabilities Management' })).toBeVisible({ timeout: 15000 });
    // Check for the summary text specifically
    await expect(page.getByText('Total Liabilities', { exact: false })).toBeVisible();
    await expect(page.getByText('Liability Entries', { exact: false })).toBeVisible();
    await expect(page.locator('#btn-add-liability')).toBeVisible();
  });

  test('Should perform full CRUD on a Liability record', async ({ page }) => {
    // 1. Create
    await page.click('#btn-add-liability');
    await expect(page.locator('h2', { hasText: /Add Liability/i })).toBeVisible();

    const accountSelect = page.locator('select').first();
    await accountSelect.selectOption('new');
    
    await page.getByPlaceholder('e.g. หนี้เพื่อน A').fill(liabilityName);
    
    const newAccSection = page.locator('.space-y-4.p-4');
    const instSelect = newAccSection.locator('select').first();
    const instOptions = await instSelect.locator('option').all();
    if (instOptions.length > 1) {
      await instSelect.selectOption({ index: 1 });
    }

    await page.fill('#input-liability-amount', '50000');
    await page.locator('label:has-text("As of Date") + input').fill('2026-04-10');

    const savePromise = page.waitForResponse(res => res.url().includes('/api/v1/financial-records') && res.status() === 201);
    await page.click('#btn-save-liability');
    await savePromise;
    await page.waitForTimeout(500);

    await expect(page.locator('text=Liability record added successfully')).toBeVisible();

    const row = page.locator('tr').filter({ hasText: liabilityName }).first();
    await expect(row).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '฿50,000.00' })).toBeVisible();

    // 2. Edit
    await row.locator('button[title="Edit"]').click();
    await expect(page.locator('h2', { hasText: /Edit Liability/i })).toBeVisible();
    await page.fill('#input-liability-amount', '45000');
    await page.locator('label:has-text("As of Date") + input').fill('2026-04-12');

    await page.click('#btn-save-liability');
    await expect(page.locator('text=Liability record updated successfully')).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '฿45,000.00' })).toBeVisible();

    // 3. Delete
    await row.locator('button[title="Delete"]').click();
    await expect(page.getByText('Liability record removed successfully')).toBeVisible();
    await expect(row).not.toBeVisible();
  });

  test('Should log another record for an existing liability account', async ({ page }) => {
    // 1. Create initial new account
    await page.click('#btn-add-liability');
    const accountSelect = page.locator('select').first();
    await accountSelect.selectOption('new');
    await page.getByPlaceholder('e.g. หนี้เพื่อน A').fill(liabilityName2);
    
    const newAccSection = page.locator('.space-y-4.p-4');
    const instSelect = newAccSection.locator('select').first();
    if ((await instSelect.locator('option').count()) > 1) {
      await instSelect.selectOption({ index: 1 });
    }
    
    await page.fill('#input-liability-amount', '10000');
    
    const savePromise1 = page.waitForResponse(res => res.url().includes('/api/v1/financial-records') && res.status() === 201);
    await page.click('#btn-save-liability');
    const response1 = await savePromise1;
    const { record } = await response1.json();
    const accountId = record.accountId;

    await page.waitForTimeout(500);
    await expect(page.locator('text=Liability record added successfully')).toBeVisible();

    const row = page.locator('tr').filter({ hasText: liabilityName2 }).first();
    await expect(row).toBeVisible();

    // 2. Add a second record for the SAME account
    await page.waitForTimeout(1000);
    await page.click('#btn-add-liability');
    
    await accountSelect.selectOption(accountId);
    await expect(page.getByPlaceholder('e.g. หนี้เพื่อน A')).not.toBeVisible();

    await page.fill('#input-liability-amount', '12000');
    await page.locator('label:has-text("As of Date") + input').fill('2026-05-01');
    
    const savePromise2 = page.waitForResponse(res => res.url().includes('/api/v1/financial-records') && res.status() === 201);
    await page.click('#btn-save-liability');
    await savePromise2;
    await expect(page.locator('text=Liability record added successfully')).toBeVisible();

    // 3. Verify that the record is UPDATED (not duplicated) in this view
    const rows = page.locator('tr').filter({ hasText: liabilityName2 });
    await expect(rows).toHaveCount(1);
    await expect(rows.locator('td').filter({ hasText: '฿12,000.00' })).toBeVisible();
  });
});
