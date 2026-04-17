import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Transaction Categories Master Data CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Categories (Setup dropdown)
    await page.locator('button:has-text("Setup")').hover();
    await page.locator('div.group:has-text("Setup") a:has-text("Categories")').click();
    await expect(page).toHaveURL(`${baseURL}/dashboard/categories`);

    // Handle dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  const uniqueSuffix = Date.now().toString().slice(-4);
  const categoryName = `Test Category ${uniqueSuffix}`;

  test('Should perform full CRUD on Transaction Categories', async ({ page }) => {
    // 1. Create
    await page.click('button:has-text("Add New Category")');
    await expect(page.locator('h2', { hasText: 'Create New Category' })).toBeVisible();

    await page.fill('input[placeholder="e.g. อาหาร, เงินเดือน"]', categoryName);
    
    // Select a type
    const typeSelect = page.locator('select');
    const options = await typeSelect.locator('option').all();
    if (options.length > 1) {
       await typeSelect.selectOption({ index: 1 });
    }

    await page.click('button:has-text("Save Category")');
    await expect(page.locator('text=Category created successfully')).toBeVisible();

    // 2. Verify in table
    const row = page.locator('tr', { hasText: categoryName }).first();
    await expect(row).toBeVisible();

    // 3. Edit
    await row.locator('button.text-blue-600').click();
    await expect(page.locator('h2', { hasText: 'Edit Category' })).toBeVisible();

    const updatedName = `${categoryName} Updated`;
    await page.fill('input[placeholder="e.g. อาหาร, เงินเดือน"]', updatedName);

    await page.click('button:has-text("Save Category")');
    await expect(page.locator('text=Category updated successfully')).toBeVisible();

    // Verify change
    const updatedRow = page.locator('tr', { hasText: updatedName }).first();
    await expect(updatedRow).toBeVisible();

    // 4. Delete
    await updatedRow.locator('button.text-red-600').click();
    await expect(page.locator('text=Category deleted successfully')).toBeVisible();
    await expect(updatedRow).not.toBeVisible();
  });
});
