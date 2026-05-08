import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { loginHandler, getPublicKeyHandler } from '../controllers/auth.controller';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    session: {
      upsert: vi.fn(),
    }
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('RSA Login Security Flow', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      log: { error: vi.fn() },
      body: {},
      jwtSign: vi.fn().mockResolvedValue('mock-token'),
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      jwtSign: vi.fn().mockResolvedValue('mock-token'),
    };
  });

  it('SHOULD complete the full RSA handshake and login', async () => {
    // 1. Get Public Key from API
    await getPublicKeyHandler(mockRequest, mockReply);
    const { publicKey, keyId } = mockReply.send.mock.calls[0][0];

    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(keyId).toBeDefined();

    // 2. Simulate Client-side encryption
    const plainPassword = 'mysecurepassword123';
    const encryptedPassword = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(plainPassword)
    ).toString('base64');

    // 3. Attempt Login with encrypted password
    mockRequest.body = {
      email: 'test@nexworth.online',
      encryptedPassword: encryptedPassword,
      keyId: keyId
    };

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@nexworth.online',
      passwordHash: 'hashed-pwd',
      isActive: true,
      role: { name: 'User', permissions: [] }
    });

    (bcrypt.compare as any).mockResolvedValue(true);

    await loginHandler(mockRequest, mockReply);

    // Verify successful login
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Logged in successfully'
    }));

    // Verify bcrypt was called with the DECRYPTED password
    expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, 'hashed-pwd');
  });

  it('SHOULD fail if keyId is invalid or session expired', async () => {
    mockRequest.body = {
      email: 'test@nexworth.online',
      encryptedPassword: 'some-base64-string',
      keyId: '00000000-0000-0000-0000-000000000000'
    };

    await loginHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Invalid or expired encryption session'
    });
  });
});
