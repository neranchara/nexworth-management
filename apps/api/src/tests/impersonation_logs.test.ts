import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { adminService } from '../services/admin.service';
import { buildServer } from '../server';
import jsonwebtoken from 'jsonwebtoken';
import { config } from '../config';
import { FastifyInstance } from 'fastify';

describe('Impersonation Logs API & Service', () => {
  let adminId: string;
  let userId: string;
  let testOrgId: string;
  let server: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    // Setup Admin and User
    const org = await prisma.organization.create({ data: { name: 'Support Test Org' } });
    testOrgId = org.id;

    const adminUser = await prisma.user.create({
      data: {
        email: 'ops-admin@test.com',
        passwordHash: 'hash',
        organizationId: testOrgId,
        isSystemAdmin: true
      }
    });
    adminId = adminUser.id;

    const targetUser = await prisma.user.create({
      data: {
        email: 'help-user@test.com',
        passwordHash: 'hash',
        organizationId: testOrgId
      }
    });
    userId = targetUser.id;

    // Boot Fastify Server
    server = await buildServer();

    // Sign Admin Token
    adminToken = jsonwebtoken.sign(
      { 
        sub: adminUser.id, 
        email: adminUser.email, 
        role: 'Admin', 
        isSystemAdmin: true,
        organizationId: testOrgId
      },
      config.jwtSecret
    );

    // Create session in Database to bypass middleware token validation
    await prisma.session.create({
      data: {
        userId: adminUser.id,
        token: adminToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  });

  afterAll(async () => {
    // Close Server
    if (server) {
      await server.close();
    }

    // Cleanup - deleting users, sessions, and org
    await prisma.session.deleteMany({ where: { token: adminToken } });
    await prisma.impersonationLog.deleteMany({
      where: {
        OR: [
          { impersonatorId: adminId },
          { targetUserId: userId }
        ]
      }
    });
    await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.organization.delete({ where: { id: testOrgId } });
  });

  it('should create and retrieve impersonation logs correctly', async () => {
    // 1. Create a log
    const log = await prisma.impersonationLog.create({
      data: {
        impersonatorId: adminId,
        targetUserId: userId,
        ticketReference: 'UNIT-TEST-TICKET',
        accessIp: '127.0.0.1'
      }
    });

    expect(log.id).toBeDefined();
    expect(log.ticketReference).toBe('UNIT-TEST-TICKET');

    // 2. Retrieve via Service
    const logs = await adminService.getImpersonationLogs();
    
    // Find our log in the list
    const foundLog = logs.find(l => l.id === log.id);
    expect(foundLog).toBeDefined();
    expect(foundLog?.impersonator.email).toBe('ops-admin@test.com');
    expect(foundLog?.targetUser.email).toBe('help-user@test.com');
  });

  it('should include target user details in the log', async () => {
    const logs = await adminService.getImpersonationLogs();
    const testLog = logs.find(l => l.ticketReference === 'UNIT-TEST-TICKET');
    
    expect(testLog?.targetUser).toHaveProperty('email');
    expect(testLog?.targetUser).toHaveProperty('firstName');
    expect(testLog?.impersonator).toHaveProperty('email');
  });

  it('should successfully call impersonate API via server inject and return correct claims', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/impersonate',
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        targetUserId: userId,
        ticketReference: 'SUPPORT-5678'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('Impersonation started');
    expect(body.token).toBeDefined();

    // Verify token claims
    const decoded: any = jsonwebtoken.verify(body.token, config.jwtSecret);
    expect(decoded.id).toBe(userId);
    expect(decoded.impersonatorId).toBe(adminId);
    expect(decoded.isImpersonated).toBe(true);

    // Verify a log was written to DB
    const dbLog = await prisma.impersonationLog.findFirst({
      where: {
        ticketReference: 'SUPPORT-5678'
      }
    });
    expect(dbLog).toBeDefined();
    expect(dbLog?.impersonatorId).toBe(adminId);
    expect(dbLog?.targetUserId).toBe(userId);
  });
});
