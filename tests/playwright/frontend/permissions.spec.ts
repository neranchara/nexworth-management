import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Role Permissions Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Permissions (Setup dropdown)
    await page.locator('button:has-text("Setup")').hover();
    await page.locator('div.group:has-text("Setup") a:has-text("Role Permissions")').click();
    await expect(page).toHaveURL(`${baseURL}/dashboard/permissions`);

    // Handle dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  test('Should load Permissions page and toggle a setting', async ({ page }) => {
    // Verify Resource list loaded
    await expect(page.locator('tr', { hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('tr', { hasText: 'Monthly Summary' })).toBeVisible();
    await expect(page.locator('tr', { hasText: 'Transactions' })).toBeVisible();

    // Select a Role (if multiple exist)
    const roleSelect = page.locator('select');
    await expect(roleSelect).toBeVisible();
    
    // Toggle a checkbox in the first row (Dashboard)
    // There are 4 checkboxes per row (View, Create, Update, Delete)
    const firstRowViewCheckbox = page.locator('tr').filter({ hasText: 'Dashboard' }).locator('input[type="checkbox"]').nth(0);
    const initialState = await firstRowViewCheckbox.isChecked();
    
    // Toggle
    await firstRowViewCheckbox.click();
    expect(await firstRowViewCheckbox.isChecked()).not.toBe(initialState);

    // Save Changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Permissions updated successfully')).toBeVisible();

    // Reset back for test hygiene (optional but good)
    await firstRowViewCheckbox.click();
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Permissions updated successfully')).toBeVisible();
  });
});
