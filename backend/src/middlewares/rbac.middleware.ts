import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const decoded = request.user as { sub: string; email: string; role: string };

      if (!decoded.role) {
        return reply.status(403).send({ error: 'Role not found in token' });
      }

      // Check if the user's role is in the list of allowed roles.
      // E.g. ['Admin', 'Officer'] 
      if (!allowedRoles.includes(decoded.role) && !allowedRoles.includes('*')) {
        return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };
};
