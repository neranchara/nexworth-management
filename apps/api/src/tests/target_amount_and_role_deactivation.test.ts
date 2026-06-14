import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { createAccountHandler, updateAccountHandler } from '../controllers/account.controller';
import { createRoleHandler, deleteRoleHandler, listAllRolesHandler } from '../controllers/permission.controller';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('Target Amount and Soft Delete Role Deactivation Integration Tests', () => {
  let testOrgId: string;
  let testUserId: string;
  let createdAccountId: string;
  let createdRoleId: string;

  beforeAll(async () => {
    // Setup test organization
    const org = await prisma.organization.create({
      data: { name: 'Test Target & Deactivation Org' },
    });
    testOrgId = org.id;

    // Setup test user
    const user = await prisma.user.create({
      data: {
        email: `test_dev_qa_${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        organizationId: testOrgId,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup accounts
    if (createdAccountId) {
      await prisma.asset.deleteMany({ where: { accountId: createdAccountId } });
      await prisma.account.deleteMany({ where: { id: createdAccountId } });
    }
    // Cleanup roles
    if (createdRoleId) {
      await prisma.permission.deleteMany({ where: { roleId: createdRoleId } });
      await prisma.role.deleteMany({ where: { id: createdRoleId } });
    }
    // Cleanup user & org
    await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.organization.delete({ where: { id: testOrgId } });
  });

  describe('GOAL-type Account targetAmount persistence', () => {
    it('SHOULD successfully save targetAmount when creating a new GOAL account', async () => {
      const mockRequest = {
        user: {
          sub: testUserId,
          organizationId: testOrgId,
        },
        body: {
          name: 'My Special Savings Goal',
          type: 'GOAL',
          isActive: true,
          isPersonal: true,
          targetAmount: 150000.50,
        },
        log: { error: console.error },
      } as unknown as FastifyRequest;

      let statusCode = 200;
      let responseBody: any = null;

      const mockReply = {
        status: (code: number) => {
          statusCode = code;
          return mockReply;
        },
        send: (payload: any) => {
          responseBody = payload;
          return mockReply;
        },
      } as unknown as FastifyReply;

      await createAccountHandler(mockRequest, mockReply);

      expect(statusCode).toBe(201);
      expect(responseBody.account).toBeDefined();
      expect(responseBody.account.name).toBe('My Special Savings Goal');
      expect(responseBody.account.type).toBe('GOAL');
      expect(responseBody.account.targetAmount).toBe(150000.50);

      createdAccountId = responseBody.account.id;
    });

    it('SHOULD successfully update targetAmount of an existing GOAL account', async () => {
      const mockRequest = {
        params: { id: createdAccountId },
        user: {
          sub: testUserId,
          role: 'User',
          organizationId: testOrgId,
        },
        body: {
          name: 'My Updated Savings Goal',
          type: 'GOAL',
          isActive: true,
          isPersonal: true,
          targetAmount: 200000.00,
        },
        log: { error: console.error },
      } as unknown as FastifyRequest<{ Params: { id: string } }>;

      let statusCode = 200;
      let responseBody: any = null;

      const mockReply = {
        status: (code: number) => {
          statusCode = code;
          return mockReply;
        },
        send: (payload: any) => {
          responseBody = payload;
          return mockReply;
        },
      } as unknown as FastifyReply;

      await updateAccountHandler(mockRequest, mockReply);

      expect(statusCode).toBe(200);
      expect(responseBody.account).toBeDefined();
      expect(responseBody.account.name).toBe('My Updated Savings Goal');
      expect(responseBody.account.targetAmount).toBe(200000.00);

      // Verify directly in DB
      const dbAccount = await prisma.account.findUnique({
        where: { id: createdAccountId },
      });
      expect(dbAccount?.targetAmount).toBe(200000.00);
    });
  });

  describe('Role Deactivation & Listing Filter', () => {
    it('SHOULD NOT return a soft-deleted/deactivated role in listAllRolesHandler', async () => {
      // 1. Create a role
      const mockCreateRequest = {
        user: {
          organizationId: testOrgId,
          isSystemAdmin: false,
        },
        body: {
          name: 'Temporary Assistant',
          description: 'A temporary helper role',
        },
        log: { error: console.error },
      } as unknown as FastifyRequest;

      let createStatusCode = 200;
      let createResponseBody: any = null;

      const mockCreateReply = {
        status: (code: number) => {
          createStatusCode = code;
          return mockCreateReply;
        },
        send: (payload: any) => {
          createResponseBody = payload;
          return mockCreateReply;
        },
      } as unknown as FastifyReply;

      await createRoleHandler(mockCreateRequest, mockCreateReply);
      expect(createStatusCode).toBe(201);
      createdRoleId = createResponseBody.role.id;

      // 2. Query all roles - Should include the new role
      const mockListRequestBefore = {
        user: {
          organizationId: testOrgId,
          isSystemAdmin: false,
          role: 'Member',
        },
        query: {},
        log: { error: console.error },
      } as unknown as FastifyRequest;

      let listBeforeBody: any = null;
      const mockListReplyBefore = {
        status: () => mockListReplyBefore,
        send: (payload: any) => {
          listBeforeBody = payload;
          return mockListReplyBefore;
        },
      } as unknown as FastifyReply;

      await listAllRolesHandler(mockListRequestBefore, mockListReplyBefore);
      expect(listBeforeBody.roles).toBeDefined();
      const hasRoleBefore = listBeforeBody.roles.some((r: any) => r.id === createdRoleId);
      expect(hasRoleBefore).toBe(true);

      // 3. Soft-delete the role
      const mockDeleteRequest = {
        user: {
          organizationId: testOrgId,
        },
        params: { roleId: createdRoleId },
        log: { error: console.error },
      } as unknown as FastifyRequest;

      let deleteBody: any = null;
      const mockDeleteReply = {
        status: () => mockDeleteReply,
        send: (payload: any) => {
          deleteBody = payload;
          return mockDeleteReply;
        },
      } as unknown as FastifyReply;

      await deleteRoleHandler(mockDeleteRequest, mockDeleteReply);
      expect(deleteBody.message).toContain('deactivated successfully');

      // 4. Query all roles again - Should NOT include the deactivated role
      const mockListRequestAfter = {
        user: {
          organizationId: testOrgId,
          isSystemAdmin: false,
          role: 'Member',
        },
        query: {},
        log: { error: console.error },
      } as unknown as FastifyRequest;

      let listAfterBody: any = null;
      const mockListReplyAfter = {
        status: () => mockListReplyAfter,
        send: (payload: any) => {
          listAfterBody = payload;
          return mockListReplyAfter;
        },
      } as unknown as FastifyReply;

      await listAllRolesHandler(mockListRequestAfter, mockListReplyAfter);
      expect(listAfterBody.roles).toBeDefined();
      const hasRoleAfter = listAfterBody.roles.some((r: any) => r.id === createdRoleId);
      expect(hasRoleAfter).toBe(false);
    });
  });
});
