import { FastifyInstance } from 'fastify';
import { 
  listFinancialRecordsHandler, 
  createFinancialRecordHandler, 
  updateFinancialRecordHandler, 
  deleteFinancialRecordHandler 
} from '../controllers/financial-record.controller.js';

export default async function financialRecordRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/financial-records', listFinancialRecordsHandler);
  fastify.post('/financial-records', createFinancialRecordHandler);
  fastify.put('/financial-records/:id', updateFinancialRecordHandler);
  fastify.delete('/financial-records/:id', deleteFinancialRecordHandler);
}
