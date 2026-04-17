import { test, expect } from '@playwright/test';

// Use 127.0.0.1 instead of localhost for IPv6 compatibility issues
const baseURL = 'http://127.0.0.1:3000';
const backendUrl = 'http://127.0.0.1:3001/api/v1';

test.describe('User Management CRUD Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Navigate to Users (Setup dropdown)
    await page.locator('button:has-text("Setup")').hover();
    await page.locator('div.group:has-text("Setup") a:has-text("Users Management")').click();
    await expect(page).toHaveURL(`${baseURL}/dashboard/users`);
    // Wait for the table/data to load
    await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible();

    // Debug API errors
    page.on('response', async (res) => {
      if (res.status() >= 400 && res.url().includes('/api/v1/')) {
        console.error('API Error:', res.url(), res.status(), await res.text().catch(() => ''));
      }
    });

    // Handle all dialogs globally
    page.on('dialog', dialog => dialog.accept());
  });

  const testUserEmail = `testuser_${Date.now()}@nexworth.local`;
  const testUserName = 'TestName';

  test('Should perform full CRUD on a User', async ({ page }) => {
    // 1. Create User
    await page.click('button:has-text("Add user")');
    await expect(page.locator('h2', { hasText: 'Create New User' })).toBeVisible();

    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.locator('div').filter({ hasText: /^First Name$/ }).getByRole('textbox').fill(testUserName);
    await page.locator('div').filter({ hasText: /^Last Name$/ }).getByRole('textbox').fill('TestLast');
    
    // Select Role
    await page.locator('select').first().selectOption({ label: 'Guest' });
    
    // Select Organization
    await page.locator('select').last().selectOption({ index: 1 }); // Select first real org (index 0 is placeholder)

    await page.click('button:has-text("Save User")');

    // Assert Success popup
    await expect(page.locator('text=User created successfully')).toBeVisible();
    await expect(page.locator('text=User created successfully')).toBeHidden(); // Wait for it to clear

    // Verify user in table (find row with our email)
    const userRow = page.locator('tr', { hasText: testUserEmail });
    await expect(userRow).toBeVisible();
    await expect(userRow.locator('td').nth(0)).toContainText(testUserName);
    await expect(userRow.locator('td').nth(2)).toContainText('Guest');
    // Index 3 is Organization, skipping for now as it depends on data
    await expect(userRow.locator('td').nth(4)).toContainText('Active');

    // 2. Edit User (Change Status to Inactive)
    await userRow.locator('button[title="Edit"]').click();
    await expect(page.locator('h2', { hasText: 'Edit User' })).toBeVisible();

    // Toggle Active status (click the toggle switch button)
    await page.locator('button').filter({ has: page.locator('span.pointer-events-none') }).click();
    await page.click('button:has-text("Save User")');

    await expect(page.locator('text=User updated successfully')).toBeVisible();
    await expect(userRow.locator('td').nth(4)).toContainText('Inactive');

    // 3. Delete User
    await userRow.locator('button[title="Delete"]').click();

    await expect(page.locator('text=User deleted successfully')).toBeVisible();
    await expect(userRow).not.toBeVisible();
  });
});
