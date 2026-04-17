import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Transaction Types Master Data CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Types (Setup dropdown)
    await page.locator('button:has-text("Setup")').hover();
    await page.locator('div.group:has-text("Setup") a:has-text("Transaction Types")').click();
    await expect(page).toHaveURL(`${baseURL}/dashboard/types`);

    // Handle dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  const uniqueSuffix = Date.now().toString().slice(-4);
  const typeName = `Test Type ${uniqueSuffix}`;

  test('Should perform full CRUD on Transaction Types', async ({ page }) => {
    // 1. Create
    await page.click('button:has-text("Add New Type")');
    await expect(page.locator('h2', { hasText: 'Create Type' })).toBeVisible();

    await page.fill('input[type="text"]', typeName);
    
    // Select a behavior (e.g., INCOME)
    const behaviorSelect = page.locator('select');
    await behaviorSelect.selectOption('INCOME');

    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Type created successfully')).toBeVisible();

    // 2. Verify in table
    const row = page.locator('tr', { hasText: typeName }).first();
    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(1)).toHaveText('INCOME');

    // 3. Edit
    await row.locator('button.text-blue-600').click();
    await expect(page.locator('h2', { hasText: 'Edit Type' })).toBeVisible();

    const updatedName = `${typeName} Updated`;
    await page.fill('input[type="text"]', updatedName);
    await behaviorSelect.selectOption('EXPENSE');

    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Type updated successfully')).toBeVisible();

    // Verify change
    const updatedRow = page.locator('tr', { hasText: updatedName }).first();
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.locator('td').nth(1)).toHaveText('EXPENSE');

    // 4. Delete
    await updatedRow.locator('button.text-red-600').click();
    await expect(page.locator('text=Type deleted successfully')).toBeVisible();
    await expect(updatedRow).not.toBeVisible();
  });
});
