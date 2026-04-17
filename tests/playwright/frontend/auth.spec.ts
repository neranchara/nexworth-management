import { test, expect } from '@playwright/test';

test.describe('Authentication & RBAC Flows', () => {
  
  test('Successful login should redirect to dashboard and show user info', async ({ page }) => {
    // Navigate to local frontend login
    await page.goto('http://127.0.0.1:3000/login');
    
    // Fill credentials for the seeded Admin user
    await page.fill('input[name="email"]', 'neranchara.ksr@gmail.com');
    await page.fill('input[name="password"]', 'w,j,uP@ssw0rd');
    
    // Submit
    await page.click('button[type="submit"]');

    // Should be redirected to Dashboard
    await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard');

    // Should see role badge & email
    await expect(page.locator('.font-medium', { hasText: 'Admin' })).toBeVisible();
    await expect(page.locator('text=neranchara.ksr@gmail.com')).toBeVisible();

    // Since Admin, should see 'Setup' menu and 'Users Management' inside it
    await expect(page.locator('text=Setup')).toBeVisible();
    await page.hover('text=Setup');
    await expect(page.locator('text=Users Management')).toBeVisible();
  });

  test('Guest role should NOT see Manage Users button', async ({ page, request }) => {
    // 1. Create a guest user via API first (assuming backend is running)
    const backendUrl = 'http://127.0.0.1:3001/api/v1'; // Assuming backend on 3001 
    
    // First, login as Admin to get token to create users
    const adminLoginRes = await request.post(`${backendUrl}/auth/login`, {
      data: { email: 'neranchara.ksr@gmail.com', password: 'w,j,uP@ssw0rd' }
    });
    
    // Skip if backend is not seeded/reachable for testing
    if (!adminLoginRes.ok()) test.skip(); 

    const adminLoginData = await adminLoginRes.json();
    const { token, user } = adminLoginData;
    
    // Fetch roles to get Guest role ID
    const rolesRes = await request.get(`${backendUrl}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { roles } = await rolesRes.json();
    const guestRole = roles.find((r: any) => r.name === 'Guest');

    // Create a Guest user
    const guestEmail = `guest_${Date.now()}@nexworth.local`;
    await request.post(`${backendUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        email: guestEmail,
        password: 'guestpassword',
        firstName: 'Test',
        lastName: 'Guest',
        roleId: guestRole.id,
        organizationId: user.orgId
      }
    });

    // 2. Playwright Test Flow
    await page.goto('http://127.0.0.1:3000/login');
    await page.fill('input[name="email"]', guestEmail);
    await page.fill('input[name="password"]', 'guestpassword');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard');
    
    // Verify Guest restrictions
    await expect(page.locator('text=Setup')).not.toBeVisible();
    await expect(page.locator('.font-medium', { hasText: 'Guest' })).toBeVisible();

    // Direct navigation attempt to /users should be blocked
    await page.goto('http://127.0.0.1:3000/dashboard/users');
    await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard');
  });

});
