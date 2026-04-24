import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        role: { include: { permissions: true } }, 
        organization: true 
      }
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials or inactive user' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 1 day expiry

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || 'Guest',
      isSystemAdmin: user.isSystemAdmin,
      orgId: user.organizationId,
      orgName: user.organization?.name,
      permissions: user.role?.permissions || []
    };

    const token = await reply.jwtSign(tokenPayload, { expiresIn: '1d' });

    await prisma.session.create({
      data: {
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
        isSystemAdmin: user.isSystemAdmin,
        permissions: user.role?.permissions || [],
        orgId: user.organizationId,
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

export const meHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    // Verify session in DB
    const decoded = request.user as any;
    
    // For production, you may want to double-check if the session token is still valid in DB
    // Here we just return the decoded payload directly for simplicity/speed
    return reply.send({ user: decoded });

  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};

export const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    
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
    await request.jwtVerify();
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
