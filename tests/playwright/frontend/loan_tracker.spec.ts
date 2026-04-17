import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('Loan Tracker Management CRUD Flows', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${baseURL}/dashboard`);

    // 2. Navigate
    await page.click('a:has-text("Loan Tracker")');
    await expect(page).toHaveURL(`${baseURL}/dashboard/loan-tracker`);

    // 3. Setup Dialog intercept
    page.on('dialog', dialog => dialog.accept());
  });

  const uniqueStamp = Date.now().toString().slice(-6);
  const loanName = `Test Loan Tracker ${uniqueStamp}`;

  test('Should create a loan, add repayment, and borrow more', async ({ page }) => {
    // 1. Create a New Loan
    await page.click('button:has-text("สร้างรายการยืมใหม่")');
    await expect(page.locator('h2', { hasText: 'สร้างรายการยืมใหม่' })).toBeVisible();

    await page.getByPlaceholder('เช่น ทำบ้าน, จ่ายภาษี').fill(loanName);
    
    // Select the first account
    const accountSelect = page.locator('select');
    const options = await accountSelect.locator('option').all();
    if (options.length > 1) {
      await accountSelect.selectOption({ index: 1 });
    }

    // Enter Amount
    await page.fill('input[type="number"]', '10000');
    
    // Select Date
    await page.fill('input[type="date"]', '2026-04-01');

    await page.click('button:has-text("บันทึกรายการ")');
    await expect(page.locator('text=สร้างรายการยืมเงินสำเร็จ')).toBeVisible();

    // Wait for the data table to refresh via fetchData()
    await page.waitForTimeout(2000);

    // Verify Row
    const row = page.locator('tr', { hasText: loanName }).first();
    await expect(row).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '10,000' }).first()).toBeVisible();

    // 2. Add Repayment
    await row.locator('button:has-text("คืนเงิน")').click();
    await expect(page.locator('h2', { hasText: 'รายการคืนเงิน (Repay)' })).toBeVisible();
    await page.fill('input[type="number"]', '2000');
    await page.fill('input[type="date"]', '2026-04-10');
    await page.click('button:has-text("บันทึกรายการ")');
    await expect(page.locator('text=บันทึกรายการสำเร็จ')).toBeVisible();

    // Verify repaid amount is 2000 and balance is 8000
    await expect(row.locator('td').filter({ hasText: '2,000' }).first()).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '8,000' }).first()).toBeVisible();

    // 3. Borrow More
    await row.locator('button:has-text("ยืมเพิ่ม")').click();
    await expect(page.locator('h2', { hasText: 'รายการยืมเพิ่ม (Borrow More)' })).toBeVisible();
    await page.fill('input[type="number"]', '5000');
    await page.fill('input[type="date"]', '2026-04-15');
    await page.click('button:has-text("บันทึกรายการ")');
    await expect(page.locator('text=บันทึกรายการสำเร็จ')).toBeVisible();

    // Verify Borrowed is 15000, Repaid is 2000, Balance is 13000
    await expect(row.locator('td').filter({ hasText: '15,000' }).first()).toBeVisible();
    await expect(row.locator('td').filter({ hasText: '13,000' }).first()).toBeVisible();
  });

  test('Should edit a loan entry description', async ({ page }) => {
    // Assume at least one loan exists (we just created it in the previous block)
    // Wait for data load
    await page.waitForTimeout(1000); 
    
    // Find our specific log or fallback to generic
    let row = page.locator('tr').filter({ hasText: loanName }).first();
    if (await row.count() === 0) {
      test.skip();
    }

    await row.locator('button:has-text("แก้ไข")').click();
    await expect(page.locator('h2', { hasText: 'แก้ไขรายการยืมเงิน' })).toBeVisible();

    // Name update
    await page.fill('input[type="text"].border', `${loanName} Updated`);
    
    // Save
    await page.click('button:has-text("บันทึกรายการ")');
    await expect(page.locator('text=อัพเดทรายการยืมเงินสำเร็จ')).toBeVisible();

    // Verify
    row = page.locator('tr').filter({ hasText: `${loanName} Updated` }).first();
    await expect(row).toBeVisible();
  });
});
