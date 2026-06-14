import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import crypto from 'crypto';
import { registerHandler, getPublicKeyHandler } from '../controllers/auth.controller';
import { prisma } from '../lib/prisma';

describe('Registration Flow Integration', () => {
  let mockRequest: any;
  let mockReply: any;
  const testEmail = `test_reg_${Date.now()}@example.com`;

  beforeEach(() => {
    mockRequest = {
      log: { error: vi.fn() },
      body: {},
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      const user = await prisma.user.findUnique({ 
        where: { email: testEmail },
        include: { organization: true }
      });
      
      if (user) {
        // Delete user first
        await prisma.user.delete({ where: { id: user.id } });
        
        // Delete organization (this will cascade to other defaults if configured, 
        // but we'll do our best to clean up)
        if (user.organizationId) {
          // We might need to delete roles/categories etc manually if not cascaded
          // For now, let's just delete the org
          await prisma.organization.delete({ where: { id: user.organizationId } });
        }
      }
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  });

  it('SHOULD successfully register a new user and setup defaults in the database', async () => {
    // 1. Get Public Key from the real handler logic
    await getPublicKeyHandler(mockRequest, mockReply);
    const { publicKey, keyId } = mockReply.send.mock.calls[0][0];

    expect(publicKey).toBeDefined();
    expect(keyId).toBeDefined();

    // 2. Simulate Client-side RSA encryption
    const plainPassword = 'TestPassword123!';
    const encryptedPassword = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(plainPassword)
    ).toString('base64');

    // 3. Prepare registration request
    mockRequest.body = {
      email: testEmail,
      firstName: 'Integration',
      lastName: 'Tester',
      encryptedPassword,
      keyId
    };

    // 4. Call registerHandler (This will use the REAL database)
    await registerHandler(mockRequest, mockReply);

    // 5. Verify API Response
    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Account created successfully',
      user: expect.objectContaining({
        email: testEmail
      })
    }));

    // 6. Verify Database State
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { 
        organization: true,
        role: true
      }
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.firstName).toBe('Integration');
    expect(dbUser?.organization).not.toBeNull();
    expect(dbUser?.role?.name).toBe('Admin');

    // 7. Verify seeded defaults (Transaction Categories)
    const categories = await prisma.transactionCategory.findMany({
      where: { organizationId: dbUser?.organizationId }
    });

    
    expect(categories.length).toBeGreaterThan(0);
    const incomeCategory = categories.find(c => c.name === 'เงินเดือน');
    expect(incomeCategory).toBeDefined();
  }, 20000); // Increased timeout for real DB operations
});
