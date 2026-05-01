import { FastifyInstance } from 'fastify';
import { listAccountsHandler, createAccountHandler, updateAccountHandler, deleteAccountHandler } from '../controllers/account.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function accountRoutes(server: FastifyInstance) {
  // All routes require authentication
  server.addHook('preHandler', authenticate);

  server.get('/accounts', listAccountsHandler);
  server.post('/accounts', createAccountHandler);
  server.put('/accounts/:id', updateAccountHandler);
  server.delete('/accounts/:id', deleteAccountHandler);
}
