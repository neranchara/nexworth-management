import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from './auth.middleware.js';
import { SYSTEM_ADMIN_EMAIL, SUPER_ADMIN_ROLE } from '../constants/systemConfig.js';

export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. First run centralized authentication (JWT + Session check)
      await authenticate(request, reply);

      // If authenticate sent a reply (401), we stop here
      if (reply.sent) return;

      const decoded = request.user as { sub: string; email: string; role: string; isSystemAdmin?: boolean };

      // Global bypass for system admin email, Super Admin role, or isSystemAdmin flag
      const isSuper = decoded.email === SYSTEM_ADMIN_EMAIL || decoded.role === SUPER_ADMIN_ROLE || decoded.isSystemAdmin === true;
      if (isSuper) return;

      if (!decoded.role) {
        return reply.status(403).send({ error: 'Role not found in token' });
      }

      // 2. Check if the user's role is in the list of allowed roles.
      if (!allowedRoles.includes(decoded.role) && !allowedRoles.includes('*')) {
        return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    } catch (err) {
      // If authenticate already sent 401, this block might catch it but we don't want to double-send
      if (!reply.sent) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    }
  };
};
