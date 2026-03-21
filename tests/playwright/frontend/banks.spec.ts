import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Bank Master Data Management CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'admin@nexworth.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Banks Management
    await page.click('text=Banks Management');
    await expect(page).toHaveURL(`${baseURL}/dashboard/banks`);
    await expect(page.getByRole('button', { name: 'Add New Bank' })).toBeVisible();

    // Handle dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  const uniqueCode = `BK${Date.now().toString().slice(-4)}`;
  const bankName = `Test Bank ${uniqueCode}`;

  test('Should perform full CRUD on Banks', async ({ page }) => {
    // 1. Create
    await page.click('button:has-text("Add New Bank")');
    await page.fill('input[placeholder="e.g. Kasikornbank"]', bankName);
    await page.fill('input[placeholder="e.g. KBANK"]', uniqueCode);
    await page.click('button:has-text("Save Bank")');

    await expect(page.locator('text=Bank created successfully')).toBeVisible();

    // 2. Verify in table
    const bankRow = page.locator('tr').filter({ hasText: bankName });
    await expect(bankRow).toBeVisible();
    await expect(bankRow).toContainText(uniqueCode);

    // 3. Edit
    await bankRow.locator('button[title="Edit"]').click();
    const newName = `${bankName} Updated`;
    await page.fill('input[placeholder="e.g. Kasikornbank"]', newName);
    await page.click('button:has-text("Save Bank")');

    await expect(page.locator('text=Bank updated successfully')).toBeVisible();
    await expect(page.locator('tr').filter({ hasText: newName })).toBeVisible();

    // 4. Delete
    const updatedRow = page.locator('tr').filter({ hasText: newName });
    await updatedRow.locator('button[title="Delete"]').click();

    await expect(page.locator('text=Bank deleted successfully')).toBeVisible();
    await expect(updatedRow).not.toBeVisible();
  });
});
