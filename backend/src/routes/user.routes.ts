import { FastifyInstance } from 'fastify';
import { listUsersHandler, createUserHandler, updateUserHandler, deleteUserHandler, resetPasswordHandler } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

export default async function userRoutes(server: FastifyInstance) {
  server.get('/users', { preHandler: [requireRole(['Admin'])] }, listUsersHandler);
  server.post('/users', { preHandler: [requireRole(['Admin'])] }, createUserHandler);
  server.put<{ Params: { id: string } }>('/users/:id', { preHandler: [requireRole(['Admin'])] }, updateUserHandler);
  server.delete<{ Params: { id: string } }>('/users/:id', { preHandler: [requireRole(['Admin'])] }, deleteUserHandler);
  server.post<{ Params: { id: string } }>('/users/:id/reset-password', { preHandler: [requireRole(['Admin'])] }, resetPasswordHandler);
}
