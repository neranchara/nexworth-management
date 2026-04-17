import { FastifyInstance } from 'fastify';
import {
  listTransactionsHandler,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
  bulkCreateTransactionHandler
} from '../controllers/transaction.controller.js';

export default async function transactionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/transactions', listTransactionsHandler);
  fastify.post('/transactions', createTransactionHandler);
  fastify.post('/transactions/bulk', bulkCreateTransactionHandler);
  fastify.put('/transactions/:id', updateTransactionHandler);
  fastify.delete('/transactions/:id', deleteTransactionHandler);
}
