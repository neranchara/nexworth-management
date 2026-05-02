import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. Verify JWT signature and expiration
    await request.jwtVerify();

    // 2. Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid token format' });
    }

    // 3. Verify session in Database (Token Revocation Check)
    const session = await prisma.session.findUnique({
      where: { token }
    });

    if (!session) {
      return reply.status(401).send({ error: 'Unauthorized: Session revoked or expired' });
    }

    // Optional: Check if session is expired in DB even if JWT is still valid
    if (session.expiresAt < new Date()) {
      // Cleanup expired session
      await prisma.session.delete({ where: { id: session.id } });
      return reply.status(401).send({ error: 'Unauthorized: Session expired' });
    }

  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};
