import { FastifyInstance } from 'fastify';
import { listBanksHandler, createBankHandler, updateBankHandler, deleteBankHandler } from '../controllers/bank.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function bankRoutes(server: FastifyInstance) {
  // Public (Authenticated) route for listing banks
  server.get('/banks', { preHandler: [authenticate] }, listBanksHandler);

  // Admin-only routes
  server.post('/banks', { preHandler: [requireRole(['Admin'])] }, createBankHandler);
  server.put<{ Params: { id: string } }>('/banks/:id', { preHandler: [requireRole(['Admin'])] }, updateBankHandler);
  server.delete<{ Params: { id: string } }>('/banks/:id', { preHandler: [requireRole(['Admin'])] }, deleteBankHandler);
}
