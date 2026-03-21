import { test, expect } from '@playwright/test';

const backendUrl = 'http://127.0.0.1:3001/api/v1';

test.describe('Backend API Integration Tests', () => {
  test('Should return 200 for health check', async ({ request }) => {
    const response = await request.get(`${backendUrl}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('Should list banks master data', async ({ request }) => {
    const response = await request.get(`${backendUrl}/banks`);
    expect(response.status()).toBe(200);
    const banks = await response.json();
    expect(Array.isArray(banks)).toBe(true);
    if (banks.length > 0) {
      expect(banks[0]).toHaveProperty('id');
      expect(banks[0]).toHaveProperty('name');
      expect(banks[0]).toHaveProperty('code');
    }
  });

  test('Should return 401 for protected routes without token', async ({ request }) => {
    const response = await request.get(`${backendUrl}/accounts`);
    expect(response.status()).toBe(401);
  });
});
