import { FastifyInstance } from 'fastify';
import { listLoansHandler, createLoanHandler, addLoanTransactionHandler, updateLoanHandler } from '../controllers/loan.controller.js';

export async function loanRoutes(fastify: FastifyInstance) {
  // Protect all loan routes
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', listLoansHandler);
  fastify.post('/', createLoanHandler);
  fastify.put('/:id', updateLoanHandler);
  fastify.post('/:id/transactions', addLoanTransactionHandler);
}
