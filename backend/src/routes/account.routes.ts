import { FastifyInstance } from 'fastify';
import { listAccountsHandler, createAccountHandler, updateAccountHandler, deleteAccountHandler } from '../controllers/account.controller.js';

export default async function accountRoutes(server: FastifyInstance) {
  // All routes require authentication
  server.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  server.get('/accounts', listAccountsHandler);
  server.post('/accounts', createAccountHandler);
  server.put('/accounts/:id', updateAccountHandler);
  server.delete('/accounts/:id', deleteAccountHandler);
}
