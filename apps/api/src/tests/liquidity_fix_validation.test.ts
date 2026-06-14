import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';
import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import { buildServer } from '../server.js';

describe('Liquidity Thresholds Fix Validation', () => {
  const JWT_SECRET = 'local_dev_secret_key_123';
  let testUser: any;
  let testOrg: any;
  let authToken: string;
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    // 1. Create Test Org and User
    testOrg = await prisma.organization.create({
      data: { name: 'Liquidity Test Org' }
    });

    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        organizationId: testOrg.id,
        isSystemAdmin: false
      }
    });

    // 2. Generate Token and Create Session
    authToken = jsonwebtoken.sign(
      { sub: testUser.id, email: testUser.email, organizationId: testOrg.id },
      JWT_SECRET
    );

    await prisma.session.create({
      data: {
        userId: testUser.id,
        token: authToken,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });
    if (server) await server.close();
  });

  it('should successfully update thresholds via PATCH /users/:id', async () => {
    const updateData = {
      liquidityDangerZone: 123456,
      liquiditySafeZone: 234567
    };

    try {
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/v1/users/${testUser.id}`,
        payload: updateData,
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.statusCode).toBe(200);
      
      // Verify in DB
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser?.liquidityDangerZone).toBe(123456);
      expect(updatedUser?.liquiditySafeZone).toBe(234567);
    } catch (error: any) {
      console.error('PATCH failed:', error.response?.data || error.message);
      throw error;
    }
  });

  it('should reflect updated thresholds in /dashboard/cockpit', async () => {
    try {
      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/dashboard/cockpit`,
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.summary.liquidityDangerZone).toBe(123456);
      expect(data.summary.liquiditySafeZone).toBe(234567);
    } catch (error: any) {
      console.error('Dashboard Cockpit failed:', error.response?.data || error.message);
      throw error;
    }
  });
});
