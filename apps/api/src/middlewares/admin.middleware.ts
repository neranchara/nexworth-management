import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from './auth.middleware.js';
import { ADMIN_ROLES } from '../constants/systemConfig.js';

/**
 * Admin-specific RBAC Guard.
 * Strictly separates Admin/Operational access from standard User access.
 */
export const adminGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. Run standard authentication
    await authenticate(request, reply);
    if (reply.sent) return;

    const user = request.user as { sub: string; email: string; role: string; isSystemAdmin?: boolean };

    // 2. Strict Role Check
    const allowedAdminRoles = [...ADMIN_ROLES];
    const hasAdminAccess = allowedAdminRoles.includes(user.role) || user.isSystemAdmin === true;

    if (!hasAdminAccess) {
      // Security through obscurity: We could return 404 instead of 403 to hide admin routes
      return reply.status(403).send({ 
        error: 'Forbidden', 
        message: 'Access denied: Admin privileges required.' 
      });
    }

    // 3. Optional: Organization Integrity Check
    // Ensure that Admin operations are logged (Audit Log middleware already handles this at DB level)
    console.log(`[AdminGuard] Access granted to ${user.email} for ${request.url}`);

  } catch (err) {
    if (!reply.sent) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  }
};
