import { test, expect } from '@playwright/test';

const backendUrl = process.env.API_PORT ? `http://127.0.0.1:${process.env.API_PORT}/api/v1` : 'http://127.0.0.1:3001/api/v1';

test.describe('Organizations API Integration Tests', () => {
  let superAdminToken: string;
  let regularUserToken: string;

  test.beforeAll(async ({ request }) => {
    // 1. Login as Super Admin
    const superAdminRes = await request.post(`${backendUrl}/auth/login`, {
      data: { email: 'superadmin@nexworth.net', password: 'superpassword123' }
    });
    expect(superAdminRes.status()).toBe(200);
    const superAdminData = await superAdminRes.json();
    superAdminToken = superAdminData.token;

    // 2. Login as Regular Admin (neranchara)
    const regularRes = await request.post(`${backendUrl}/auth/login`, {
      data: { email: 'neranchara.ksr@gmail.com', password: 'w,j,uP@ssw0rd' }
    });
    expect(regularRes.status()).toBe(200);
    const regularData = await regularRes.json();
    regularUserToken = regularData.token;
  });

  test('Super Admin should be able to list organizations', async ({ request }) => {
    const response = await request.get(`${backendUrl}/organizations`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('Regular Admin should NOT be able to list organizations', async ({ request }) => {
    const response = await request.get(`${backendUrl}/organizations`, {
      headers: { Authorization: `Bearer ${regularUserToken}` }
    });
    expect(response.status()).toBe(403);
  });

  test('Super Admin should be able to create a new organization', async ({ request }) => {
    const uniqueId = Date.now();
    const newOrgData = {
      name: `Test Org ${uniqueId}`,
      adminEmail: `admin_${uniqueId}@test.com`,
      adminPassword: 'password123',
      adminFirstName: 'Test',
      adminLastName: 'Admin'
    };

    const response = await request.post(`${backendUrl}/organizations`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
      data: newOrgData
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.organization.name).toBe(newOrgData.name);
    expect(body.admin.email).toBe(newOrgData.adminEmail);

    // Verify the new admin can login
    const loginRes = await request.post(`${backendUrl}/auth/login`, {
      data: { email: newOrgData.adminEmail, password: newOrgData.adminPassword }
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.user.orgName).toBe(newOrgData.name);
  });

  test('Regular Admin should NOT be able to create an organization', async ({ request }) => {
    const response = await request.post(`${backendUrl}/organizations`, {
      headers: { Authorization: `Bearer ${regularUserToken}` },
      data: { name: 'Hack Org', adminEmail: 'hacker@test.com', adminPassword: 'password123' }
    });
    expect(response.status()).toBe(403);
  });
});
