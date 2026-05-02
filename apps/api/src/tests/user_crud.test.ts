import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createUserHandler, updateUserHandler, deleteUserHandler } from '../controllers/user.controller.js';
import { prisma } from '@nexworth/database';

// Mock @nexworth/database
vi.mock('@nexworth/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

describe('User CRUD Logic Tests', () => {
  let mockRequest: any;
  let mockReply: any;
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const OTHER_UUID = '987f6543-210b-32a1-b654-098765432109';

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      log: { error: vi.fn() },
      user: { sub: VALID_UUID, organizationId: VALID_UUID, isSystemAdmin: false },
      body: {},
      params: {},
      query: {},
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  // --- CREATE ---
  it('CREATE: should allow admin to create user in their own org', async () => {
    mockRequest.body = { 
      email: 'new@test.com', 
      password: 'password123', 
      organizationId: VALID_UUID, 
      roleId: VALID_UUID,
      isActive: true
    };
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: VALID_UUID, email: 'new@test.com' });

    await createUserHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('CREATE: should prevent non-system admin from creating user in OTHER org', async () => {
    mockRequest.body = { 
      email: 'hacker@test.com', 
      password: 'password123', 
      organizationId: OTHER_UUID, 
      roleId: VALID_UUID,
      isActive: true
    };

    await createUserHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  // --- UPDATE ---
  it('UPDATE: should allow user to update their own profile', async () => {
    mockRequest.params = { id: VALID_UUID };
    mockRequest.body = { firstName: 'Updated Name' };
    (prisma.user.findUnique as any).mockResolvedValue({ id: VALID_UUID, organizationId: VALID_UUID });
    (prisma.user.update as any).mockResolvedValue({ id: VALID_UUID, firstName: 'Updated Name' });

    await updateUserHandler(mockRequest, mockReply);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'User updated' }));
  });

  // --- DELETE (Soft Delete) ---
  it('DELETE: should allow admin to deactivate user in their own org', async () => {
    mockRequest.params = { id: OTHER_UUID };
    (prisma.user.findUnique as any).mockResolvedValue({ id: OTHER_UUID, organizationId: VALID_UUID });

    await deleteUserHandler(mockRequest, mockReply);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { isActive: false }
    });
    expect(mockReply.send).toHaveBeenCalledWith({ message: 'User deactivated (Soft Delete)' });
  });
});
