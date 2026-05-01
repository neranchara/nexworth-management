import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateRoleHandler } from '../controllers/permission.controller.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    role: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Permission Management Logic Tests', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('should allow System Admin to update role in a different organization', async () => {
    mockRequest = {
      user: { isSystemAdmin: true, organizationId: 'sys-org-id', orgName: 'System Management' },
      params: { roleId: 'other-org-role-id' },
      body: { name: 'Updated Role' },
      log: { error: vi.fn() }
    };

    (prisma.role.findFirst as any).mockResolvedValue({
      id: 'other-org-role-id',
      organizationId: 'other-org-id'
    });

    await updateRoleHandler(mockRequest, mockReply);

    expect(mockReply.status).not.toHaveBeenCalledWith(403);
    expect(mockReply.status).not.toHaveBeenCalledWith(404);
    expect(prisma.role.update).toHaveBeenCalled();
  });

  it('should prevent Normal Admin from updating role in a different organization', async () => {
    mockRequest = {
      user: { isSystemAdmin: false, organizationId: 'org-a-id', orgName: 'Org A' },
      params: { roleId: 'org-b-role-id' },
      body: { name: 'Hacked Role' },
      log: { error: vi.fn() }
    };

    (prisma.role.findFirst as any).mockResolvedValue(null);

    await updateRoleHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Role not found' });
    expect(prisma.role.update).not.toHaveBeenCalled();
  });
});
