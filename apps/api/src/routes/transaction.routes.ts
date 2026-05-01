import { FastifyInstance } from 'fastify';
import {
  listTransactionsHandler,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
  bulkCreateTransactionHandler
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function transactionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/transactions', listTransactionsHandler);
  fastify.post('/transactions', createTransactionHandler);
  fastify.post('/transactions/bulk', bulkCreateTransactionHandler);
  fastify.put('/transactions/:id', updateTransactionHandler);
  fastify.delete('/transactions/:id', deleteTransactionHandler);
}
