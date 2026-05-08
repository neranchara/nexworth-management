import { FastifyInstance } from 'fastify';
import { listUsersHandler, createUserHandler, updateUserHandler, deleteUserHandler, resetPasswordHandler } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

export default async function userRoutes(server: FastifyInstance) {
  server.get('/users', { preHandler: [requireRole(['Admin'])] }, listUsersHandler);
  server.post('/users', { preHandler: [requireRole(['Admin'])] }, createUserHandler);
  server.put<{ Params: { id: string } }>('/users/:id', updateUserHandler);
  server.delete<{ Params: { id: string } }>('/users/:id', { preHandler: [requireRole(['Admin'])] }, deleteUserHandler);
  server.post<{ Params: { id: string } }>('/users/:id/reset-password', { preHandler: [requireRole(['Admin'])] }, resetPasswordHandler);

  /**
   * Transparency Log for Users
   * BA/SA Requirement: Customer-facing auditability
   */
  server.get('/me/security-logs', { preHandler: [authenticate] }, async (request: any, reply) => {
    const userId = request.user.sub;
    const logs = await prisma.impersonationLog.findMany({
      where: { targetUserId: userId },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        ticketReference: true,
        impersonator: {
          select: {
            email: true
          }
        }
      }
    });
    return { data: logs };
  });
}
