import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { 
  requestPasswordResetHandler, 
  verifyResetTokenHandler, 
  resetPasswordHandler,
  getPublicKeyHandler 
} from '../controllers/auth.controller';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { mailerService } from '../services/mailer.service';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordReset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    systemLog: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((actions) => Promise.all(actions)),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('new-hashed-password'),
  },
}));

vi.mock('../services/mailer.service', () => ({
  mailerService: {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  },
}));

describe('Password Reset Security Flow', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      log: { error: vi.fn() },
      body: {},
      query: {},
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('SHOULD request a reset and generate a token', async () => {
    mockRequest.body = { email: 'test@nexworth.cc' };
    
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1', email: 'test@nexworth.cc' });

    await requestPasswordResetHandler(mockRequest, mockReply);

    expect(prisma.passwordReset.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'test@nexworth.cc',
        token: expect.any(String),
      })
    }));
    expect(mailerService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@nexworth.cc',
      expect.any(String)
    );
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('sent')
    }));
  });

  it('SHOULD silently succeed if user does not exist', async () => {
    mockRequest.body = { email: 'nonexistent@nexworth.cc' };
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await requestPasswordResetHandler(mockRequest, mockReply);

    expect(prisma.passwordReset.create).not.toHaveBeenCalled();
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('sent')
    }));
  });

  it('SHOULD verify a valid token', async () => {
    mockRequest.query = { token: 'valid-token' };
    (prisma.passwordReset.findUnique as any).mockResolvedValue({
      token: 'valid-token',
      email: 'test@nexworth.cc',
      used: false,
      expiresAt: new Date(Date.now() + 10000)
    });

    await verifyResetTokenHandler(mockRequest, mockReply);

    expect(mockReply.send).toHaveBeenCalledWith({ valid: true, email: 'test@nexworth.cc' });
  });

  it('SHOULD fail verification if token is expired', async () => {
    mockRequest.query = { token: 'expired-token' };
    (prisma.passwordReset.findUnique as any).mockResolvedValue({
      token: 'expired-token',
      used: false,
      expiresAt: new Date(Date.now() - 10000)
    });

    await verifyResetTokenHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('SHOULD reset password using RSA encryption', async () => {
    // 1. Get Public Key
    await getPublicKeyHandler(mockRequest, mockReply);
    const { publicKey, keyId } = mockReply.send.mock.calls[0][0];

    // 2. Encrypt New Password
    const newPlainPassword = 'new-secure-password-123';
    const encryptedPassword = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(newPlainPassword)
    ).toString('base64');

    // 3. Reset Password
    mockRequest.body = {
      token: 'valid-token',
      encryptedPassword: encryptedPassword,
      keyId: keyId
    };

    (prisma.passwordReset.findUnique as any).mockResolvedValue({
      id: 'reset-1',
      token: 'valid-token',
      email: 'test@nexworth.cc',
      used: false,
      expiresAt: new Date(Date.now() + 10000)
    });

    await resetPasswordHandler(mockRequest, mockReply);

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'test@nexworth.cc' },
      data: { passwordHash: 'new-hashed-password' }
    }));
    expect(prisma.passwordReset.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { used: true }
    }));
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('successfully')
    }));
  });
});
