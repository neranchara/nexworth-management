import { FastifyInstance } from 'fastify';
import { 
  listTypesHandler, 
  createTypeHandler, 
  updateTypeHandler, 
  deleteTypeHandler 
} from '../controllers/type.controller.js';

export default async function typeRoutes(server: FastifyInstance) {
  server.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  server.get('/types', listTypesHandler);
  server.post('/types', createTypeHandler);
  server.put('/types/:id', updateTypeHandler);
  server.delete('/types/:id', deleteTypeHandler);
}
