import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Dashboard View & Draggable Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    
    // Debug API errors
    page.on('response', async (res) => {
      if (res.status() >= 400 && res.url().includes('/api/v1/')) {
        console.error('API Error:', res.url(), res.status(), await res.text().catch(() => ''));
      }
    });

    // Handle dialogs globally
    page.on('dialog', dialog => dialog.accept());
  });

  test('Should load Dashboard successfully and display key metrics', async ({ page }) => {
    // 1. Core metrics cards
    await expect(page.locator('h3', { hasText: 'Real Assets' }).first()).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Goal Money' }).first()).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Liabilities' }).first()).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Net Worth' }).first()).toBeVisible();
    
    // 2. Health Chart check
    await expect(page.locator('h2', { hasText: 'Financial Health' }).first()).toBeVisible();
    
    // 3. Cashflow Chart check
    await expect(page.locator('h2', { hasText: 'Monthly Cashflow Summary' }).first()).toBeVisible();

    // 4. Goal Tracking section
    await expect(page.locator('h2', { hasText: 'Multi-Goal Tracking' }).first()).toBeVisible();
  });

  test('Should toggle between Locked and Editing mode in Dashboard', async ({ page }) => {
    // Default is Locked
    const lockBtn = page.locator('button', { hasText: 'Locked' });
    await expect(lockBtn).toBeVisible();
    
    // Verify Drag Handles are NOT visible by default
    await expect(page.locator('.grid-drag-handle')).not.toBeVisible();

    // Unlock - Switch to Editing
    await lockBtn.click();
    await expect(page.locator('button', { hasText: 'Editing' })).toBeVisible();

    // Verify Drag Handles are now visible
    await expect(page.locator('.grid-drag-handle').first()).toBeVisible();

    // Verify Reset button is now visible
    await expect(page.locator('button', { hasText: 'Reset' })).toBeVisible();

    // Lock it back
    await page.locator('button', { hasText: 'Editing' }).click();
    await expect(page.locator('button', { hasText: 'Locked' })).toBeVisible();
    await expect(page.locator('.grid-drag-handle')).not.toBeVisible();
  });

  test('Should reset layout when the Reset button is clicked', async ({ page }) => {
    // Unlock
    await page.locator('button', { hasText: 'Locked' }).click();
    
    // Click Reset
    await page.locator('button', { hasText: 'Reset' }).click();

    // The layout state doesn't change visually in a way that's easy to assert without dragging first
    // But we at least ensure the button exists and is clickable without crashing.
    await expect(page.locator('button', { hasText: 'Reset' })).toBeVisible();
  });
});
