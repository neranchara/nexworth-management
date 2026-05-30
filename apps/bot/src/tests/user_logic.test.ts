import { vi, describe, it, expect, beforeEach } from 'vitest';
import { listUsersHandler } from '../controllers/user.controller.js';
import { prisma } from '@nexworth/database';

// Mock Prisma from the database package
vi.mock('@nexworth/database', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('User Management Logic Tests', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      log: { error: vi.fn() },
      query: {},
      user: {}
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  // --- NEW FEATURE: Hierarchical Visibility ---
  
  it('CASE 1: Org == System Management and User == SuperAdmin (Should see all)', async () => {
    mockRequest = {
      user: { role: 'Super Admin', email: 'superadmin@nexworth.cc', isSystemAdmin: true, organizationId: 'sys-id', orgName: 'System Management' },
      query: {}
    };

    await listUsersHandler(mockRequest, mockReply);
    const callArgs = (prisma.user.findMany as any).mock.calls[0][0];
    
    expect(callArgs.where.organizationId).toBe('sys-id');
    expect(callArgs.where.role).toBeUndefined(); // Should NOT hide Super Admin
  });

  it('CASE 2: Org == System Management and User != SuperAdmin (Should hide Super Admin)', async () => {
    mockRequest = {
      user: { role: 'App Support', email: 'staff@test.com', isSystemAdmin: true, organizationId: 'sys-id', orgName: 'System Management' },
      query: {}
    };

    await listUsersHandler(mockRequest, mockReply);
    const callArgs = (prisma.user.findMany as any).mock.calls[0][0];
    
    expect(callArgs.where.organizationId).toBe('sys-id');
    expect(callArgs.where.role.name.not).toBe('Super Admin'); // SHOULD hide Super Admin
  });

  it('CASE 3: Org != System Management and User == Admin (Should see their org only)', async () => {
    mockRequest = {
      user: { role: 'Admin', email: 'admin@org-a.com', isSystemAdmin: false, organizationId: 'org-a-id', orgName: 'Org A' },
      query: {}
    };

    await listUsersHandler(mockRequest, mockReply);
    const callArgs = (prisma.user.findMany as any).mock.calls[0][0];
    
    expect(callArgs.where.organizationId).toBe('org-a-id');
    expect(callArgs.where.role).toBeUndefined(); // No extra filter needed for normal orgs
  });

  // --- BUG FIX: toggleStatus ID Check ---
  // Note: Backend doesn't hardcode the ID anymore, it uses the middleware/controller logic.
  // We already refined listUsersHandler to not have the redundant filter for normal orgs.
});
