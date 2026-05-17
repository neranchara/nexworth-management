import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { securityService } from '../services/security.service';
import { mailerService } from '../services/mailer.service';
import { setupOrganizationDefaults } from '../services/organization.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).optional(), // Can be optional if encryptedPassword is provided
  encryptedPassword: z.string().optional(),
  keyId: z.string().uuid().optional(),
});

export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password, encryptedPassword, keyId } = loginSchema.parse(request.body);
    const normalizedEmail = email.toLowerCase().trim();

    let finalPassword = password;

    // RSA Decryption Logic
    if (encryptedPassword && keyId) {
      const decrypted = securityService.decrypt(keyId, encryptedPassword);
      if (!decrypted) {
        return reply.status(401).send({ error: 'Invalid or expired encryption session' });
      }
      finalPassword = decrypted;
    }

    if (!finalPassword) {
      return reply.status(400).send({ error: 'Password or Encrypted Password is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { 
        role: { include: { permissions: true } }, 
        organization: true 
      }
    });

    if (!user || !user.isActive || (user.organization && !user.organization.isActive)) {
      return reply.status(401).send({ error: 'Invalid credentials or inactive account/organization' });
    }

    const isValid = await bcrypt.compare(finalPassword, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 1 day expiry

    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.organization?.name === 'System Management';

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.name || 'Guest',
      isSystemAdmin: isSystemAdmin,
      organizationId: user.organizationId,
      orgName: user.organization?.name,
      permissions: user.role?.permissions || []
    };

    const token = await reply.jwtSign(tokenPayload, { expiresIn: '1d' });

    await prisma.session.upsert({
      where: { token: token },
      update: { expiresAt: expiresAt },
      create: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      }
    });

    return reply.status(200).send({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
        isSystemAdmin: isSystemAdmin,
        permissions: user.role?.permissions || [],
        organizationId: user.organizationId,
        orgName: user.organization?.name
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  encryptedPassword: z.string(),
  keyId: z.string().uuid(),
});

export const registerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, firstName, lastName, encryptedPassword, keyId } = registerSchema.parse(request.body);
    const normalizedEmail = email.toLowerCase().trim();

    // 1. RSA Decryption Logic
    const decryptedPassword = securityService.decrypt(keyId, encryptedPassword);
    if (!decryptedPassword) {
      return reply.status(401).send({ error: 'Invalid or expired encryption session' });
    }

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return reply.status(400).send({ error: 'Email already registered' });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(decryptedPassword, 10);

    // 4. Create Organization and User in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Organization
      const org = await tx.organization.create({
        data: { name: `${firstName}'s Workspace` }
      });

      // Create User
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          organizationId: org.id,
          isActive: true
        }
      });

      // Setup Defaults (Roles, Permissions, Categories, etc.)
      await setupOrganizationDefaults(org.id, user.id, tx);

      return { user, org };
    });

    return reply.status(201).send({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        orgName: result.org.name
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};


export const getPublicKeyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const keyData = securityService.generateKeyPair();
    return reply.send(keyData);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const meHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = request.user as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { 
        role: { include: { permissions: true } }, 
        organization: true 
      }
    });

    if (!user) return reply.status(404).send({ error: 'User not found' });

    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.organization?.name === 'System Management';

    return reply.send({ 
      user: {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
        isSystemAdmin: isSystemAdmin,
        permissions: user.role?.permissions || [],
        organizationId: user.organizationId,
        orgName: user.organization?.name
      } 
    });
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};

export const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Invalidate the session by extracting the token from header
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    return reply.send({ message: 'Logged out successfully' });
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};

export const generateLinePairingCodeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = request.user as any;
    
    // Generate a random 6-character code
    const code = 'LINK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await prisma.user.update({
      where: { id: decoded.sub },
      data: { pairingCode: code }
    });

    return reply.send({ code });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Failed to generate pairing code' });
  }
};

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).optional(),
  encryptedPassword: z.string().optional(),
  keyId: z.string().uuid().optional(),
});

export const requestPasswordResetHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email } = requestResetSchema.parse(request.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Silent success for non-existent users (BA Requirement US-01)
    if (!user) {
      return reply.send({ message: 'If this email exists in our system, a reset link has been sent.' });
    }

    // Generate secure token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins expiry

    await prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        token: token,
        expiresAt: expiresAt
      }
    });

    // Telemetry Logging
    await prisma.systemLog.create({
      data: {
        type: 'security',
        tag: 'password-reset-request',
        payload: { email: normalizedEmail, action: 'request' }
      }
    });

    // Send actual email via MailerService
    try {
      await mailerService.sendPasswordResetEmail(normalizedEmail, token);
    } catch (error) {
      // We don't fail the request if email sending fails to avoid user enumeration timing attacks,
      // but we log it for admin investigation.
      request.log.error(`[CRITICAL] Failed to send reset email to ${normalizedEmail}: ${error}`);
    }

    return reply.send({ message: 'If this email exists in our system, a reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const verifyResetTokenHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = request.query as { token: string };
    
    if (!token) return reply.status(400).send({ error: 'Token is required' });

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token }
    });

    if (!resetRequest || resetRequest.used || resetRequest.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invalid or expired token' });
    }

    return reply.send({ valid: true, email: resetRequest.email });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const resetPasswordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token, newPassword, encryptedPassword, keyId } = resetPasswordSchema.parse(request.body);

    let finalPassword = newPassword;

    // RSA Decryption Logic
    if (encryptedPassword && keyId) {
      const decrypted = securityService.decrypt(keyId, encryptedPassword);
      if (!decrypted) {
        return reply.status(401).send({ error: 'Invalid or expired encryption session' });
      }
      finalPassword = decrypted;
    }

    if (!finalPassword) {
      return reply.status(400).send({ error: 'Password or Encrypted Password is required' });
    }

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token }
    });

    if (!resetRequest || resetRequest.used || resetRequest.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // Atomic update
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetRequest.email },
        data: { passwordHash }
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true }
      }),
      prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET',
          entity: 'User',
          entityId: resetRequest.email,
          newValue: { action: 'password_changed_via_token' }
        }
      })
    ]);

    return reply.send({ message: 'Password has been reset successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
