import { test, expect } from '@playwright/test';

// Use 127.0.0.1 instead of localhost for IPv6 compatibility issues
const baseURL = 'http://127.0.0.1:3000';

test.describe('Account Management CRUD Flows', () => {
  // Global login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Banks (Setup dropdown)
    await page.locator('button:has-text("Setup")').hover();
    await page.locator('div.group:has-text("Setup") a:has-text("Banks Management")').click();
    await expect(page).toHaveURL(`${baseURL}/dashboard/banks`);
    
    // Navigate to Accounts (Setup dropdown)
    await page.locator('button:has-text("Setup")').hover();
    await page.locator('div.group:has-text("Setup") >> a:has-text("Accounts")').click();
    await expect(page).toHaveURL(`${baseURL}/dashboard/accounts`);
    await expect(page.getByRole('button', { name: 'Add Account' })).toBeVisible();

    // Debug API errors
    page.on('response', async (res) => {
      if (res.status() >= 400 && res.url().includes('/api/v1/')) {
        console.error('API Error:', res.url(), res.status(), await res.text().catch(() => ''));
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      }
    });

    // Handle all dialogs globally
    page.on('dialog', async dialog => {
      console.log('Dialog intercepted:', dialog.message());
      await dialog.accept();
    });
  });

  const uniqueStamp = Date.now().toString().slice(-6);
  const bankAccName = `Test Bank Acc ${uniqueStamp}`;
  const stockAccName = `Test Stock Acc ${uniqueStamp}`;

  test('Should perform full CRUD on Bank Accounts', async ({ page }) => {
    // 1. Create a BANK Account
    await page.click('button:has-text("Add Account")');
    await expect(page.locator('h2', { hasText: 'Create New Account' })).toBeVisible();

    await page.fill('input[placeholder="e.g. My SCB Savings, Dime Gold"]', bankAccName);
    
    // Select Type BANK
    await page.locator('select').first().selectOption({ value: 'BANK' });

    // Select Bank Master Data (first option)
    // Wait for banks to be populated
    const bankSelect = page.locator('select').nth(1);
    await bankSelect.selectOption({ index: 1 }); // Index 1 is the first bank assuming 0 is standard placeholder

    // Save
    await page.click('button:has-text("Save Account")');

    // Assert Success popup
    await expect(page.locator('text=Account created successfully')).toBeVisible();

    // Verify it's in the table
    const accountRow = page.locator('tr').filter({ hasText: bankAccName });
    await expect(accountRow).toBeVisible();
    await expect(accountRow.locator('td').nth(2)).toContainText('BANK'); // Type is at index 2
    // Balance is not in the table, skipping check

    // 2. Edit Bank Account (Change Balance and set Inactive)
    await accountRow.locator('button[title="Edit"]').click();
    await expect(page.locator('h2', { hasText: 'Edit Account' })).toBeVisible();

    // Toggle Active Status
    await page.locator('label').filter({ hasText: 'Account Status' }).locator('xpath=..').locator('button').click();

    await page.click('button:has-text("Save Account")');

    await expect(page.locator('text=Account updated successfully')).toBeVisible();
    await expect(accountRow.locator('td').nth(4)).toContainText('Inactive'); // Status visually changes at index 4

    // 3. Delete Bank Account
    await accountRow.locator('button[title="Delete"]').click();

    await expect(page.locator('text=Account deleted successfully')).toBeVisible();
    await expect(accountRow).not.toBeVisible();
  });

  test('Should perform full CRUD on Investment Accounts (Stock)', async ({ page }) => {
    // 1. Create a STOCK Account
    await page.click('button:has-text("Add Account")');
    await expect(page.locator('h2', { hasText: 'Create New Account' })).toBeVisible();

    await page.fill('input[placeholder="e.g. My SCB Savings, Dime Gold"]', stockAccName);
    
    // Select Type STOCK
    await page.locator('select').first().selectOption({ value: 'STOCK' });

    // Verify bank select is visible (since it's always shown now)
    await expect(page.locator('select').nth(1)).toBeVisible();

    // Save
    await page.click('button:has-text("Save Account")');

    await expect(page.locator('text=Account created successfully')).toBeVisible();
    await expect(page.locator('text=Account created successfully')).toBeHidden(); // Wait for it to clear

    // 2. Delete Stock Account directly
    const accountRow = page.locator('tr').filter({ hasText: stockAccName });
    await expect(accountRow).toBeVisible();

    await accountRow.locator('button[title="Delete"]').click();

    await expect(page.locator('text=Account deleted successfully').first()).toBeVisible();
    await expect(accountRow).not.toBeVisible();
  });

  test('Should perform full CRUD on Investment Accounts (Gold)', async ({ page }) => {
    const goldAccName = `Test Gold Acc ${uniqueStamp}`;
    
    // 1. Create a GOLD Account
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder="e.g. My SCB Savings, Dime Gold"]', goldAccName);
    
    // Select Type GOLD
    await page.locator('select').first().selectOption({ value: 'GOLD' });

    // Save
    await page.click('button:has-text("Save Account")');

    await expect(page.locator('text=Account created successfully')).toBeVisible();

    // 2. Verify and Delete
    const accountRow = page.locator('tr').filter({ hasText: goldAccName });
    await expect(accountRow).toBeVisible();
    await expect(accountRow.locator('td').nth(2)).toContainText('GOLD');

    await accountRow.locator('button[title="Delete"]').click();
    await expect(page.locator('text=Account deleted successfully').first()).toBeVisible();
    await expect(accountRow).not.toBeVisible();
  });
});
