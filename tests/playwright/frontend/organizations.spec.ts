import { test, expect } from '@playwright/test';

test.describe('Organizations Management UI Tests', () => {
  test('Super Admin should see the Organizations menu and can navigate to it', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@nexworth.net');
    await page.fill('input[type="password"]', 'superpassword123');
    await page.click('button[type="submit"]');

    // 2. Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard');

    // 3. Check for Organizations link
    const orgLink = page.locator('a:has-text("Organizations")');
    await expect(orgLink).toBeVisible();

    // 4. Click it
    await orgLink.click();
    await expect(page).toHaveURL('/dashboard/organizations');

    // 5. Verify page title
    await expect(page.locator('h1')).toHaveText('Organizations Management');
  });

  test('Regular Admin should NOT see the Organizations menu', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[type="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');

    // 2. Wait for navigation
    await expect(page).toHaveURL('/dashboard');

    // 3. Verify Organizations link is missing
    const orgLink = page.locator('a:has-text("Organizations")');
    await expect(orgLink).not.toBeVisible();
  });

  test('Super Admin can open Create Organization modal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@nexworth.net');
    await page.fill('input[type="password"]', 'superpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    await page.goto('/dashboard/organizations');
    await expect(page.locator('h1')).toHaveText('Organizations Management');

    // 2. Click Add Organization button
    await page.click('button:has-text("Create New Org")');

    // 3. Verify Modal title
    await expect(page.locator('h2')).toHaveText('Create New Organization');
    
    // 4. Check form fields exist
    await expect(page.locator('label:has-text("Organization Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
  });
});
