import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { 
  createRoleHandler, 
  updateRolePermissionsHandler, 
  listRolePermissionsHandler, 
  updateRoleHandler,
  deleteRoleHandler
} from '../controllers/permission.controller';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('Role and Permission Integration Tests (Staging DB)', () => {
  let orgId: string;
  let roleId: string;

  beforeAll(async () => {
    // Setup test organization in Staging DB
    const org = await prisma.organization.create({
      data: { name: 'Test Org - Role & Permission' }
    });
    orgId = org.id;
  });

  afterAll(async () => {
    // Cleanup test data from Staging DB
    if (roleId) {
      await prisma.permission.deleteMany({ where: { roleId } });
      await prisma.role.deleteMany({ where: { id: roleId } });
    }
    if (orgId) {
      await prisma.organization.deleteMany({ where: { id: orgId } });
    }
  });

  it('SHOULD successfully create a new role in the organization', async () => {
    const mockRequest = {
      user: {
        organizationId: orgId,
        isSystemAdmin: false,
      },
      body: {
        name: 'Financial Auditor',
        description: 'Read-only access to financial records'
      },
      log: { error: console.error }
    } as unknown as FastifyRequest;

    let responseStatusCode = 200;
    let responseBody: any = null;

    const mockReply = {
      status: (code: number) => {
        responseStatusCode = code;
        return mockReply;
      },
      send: (payload: any) => {
        responseBody = payload;
        return mockReply;
      }
    } as unknown as FastifyReply;

    await createRoleHandler(mockRequest, mockReply);

    expect(responseStatusCode).toBe(201);
    expect(responseBody.role).toBeDefined();
    expect(responseBody.role.name).toBe('Financial Auditor');
    expect(responseBody.role.organizationId).toBe(orgId);
    
    roleId = responseBody.role.id;
  });

  it('SHOULD successfully assign and update permissions for the created role', async () => {
    const mockRequest = {
      params: { roleId },
      body: [
        {
          resource: 'FinancialRecord',
          canView: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false
        },
        {
          resource: 'Report',
          canView: true,
          canCreate: true,
          canUpdate: false,
          canDelete: false
        }
      ],
      log: { error: console.error }
    } as unknown as FastifyRequest;

    let responseBody: any = null;
    const mockReply = {
      status: () => mockReply,
      send: (payload: any) => {
        responseBody = payload;
        return mockReply;
      }
    } as unknown as FastifyReply;

    await updateRolePermissionsHandler(mockRequest, mockReply);

    expect(responseBody.message).toBe('Permissions updated successfully');

    // Verify permissions in DB
    const permissions = await prisma.permission.findMany({
      where: { roleId },
      orderBy: { resource: 'asc' }
    });

    expect(permissions.length).toBe(2);
    expect(permissions.find(p => p.resource === 'FinancialRecord')?.canView).toBe(true);
    expect(permissions.find(p => p.resource === 'FinancialRecord')?.canCreate).toBe(false);
  });

  it('SHOULD successfully list permissions for the role', async () => {
    const mockRequest = {
      params: { roleId },
      log: { error: console.error }
    } as unknown as FastifyRequest;

    let responseBody: any = null;
    const mockReply = {
      status: () => mockReply,
      send: (payload: any) => {
        responseBody = payload;
        return mockReply;
      }
    } as unknown as FastifyReply;

    await listRolePermissionsHandler(mockRequest, mockReply);

    expect(responseBody.permissions).toBeDefined();
    expect(responseBody.permissions.length).toBe(2);
  });

  it('SHOULD successfully update the role name and description', async () => {
    const mockRequest = {
      user: {
        organizationId: orgId,
        isSystemAdmin: false,
      },
      params: { roleId },
      body: {
        name: 'Senior Financial Auditor',
        description: 'Read-only access to financial records and reports'
      },
      log: { error: console.error }
    } as unknown as FastifyRequest;

    let responseBody: any = null;
    const mockReply = {
      status: () => mockReply,
      send: (payload: any) => {
        responseBody = payload;
        return mockReply;
      }
    } as unknown as FastifyReply;

    await updateRoleHandler(mockRequest, mockReply);

    expect(responseBody.role).toBeDefined();
    expect(responseBody.role.name).toBe('Senior Financial Auditor');
    expect(responseBody.role.description).toContain('reports');
  });

  it('SHOULD successfully soft delete the role', async () => {
    const mockRequest = {
      user: {
        organizationId: orgId,
      },
      params: { roleId },
      log: { error: console.error }
    } as unknown as FastifyRequest;

    let responseBody: any = null;
    const mockReply = {
      status: () => mockReply,
      send: (payload: any) => {
        responseBody = payload;
        return mockReply;
      }
    } as unknown as FastifyReply;

    await deleteRoleHandler(mockRequest, mockReply);

    expect(responseBody.message).toContain('deactivated successfully');

    // Verify in DB
    const deletedRole = await prisma.role.findUnique({
      where: { id: roleId }
    });
    
    expect(deletedRole?.isActive).toBe(false);
  });
});
