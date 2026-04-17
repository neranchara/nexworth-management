import { FastifyInstance } from 'fastify';
import { getDashboardStatsHandler } from '../controllers/dashboard.controller.js';

export default async function dashboardRoutes(server: FastifyInstance) {
  server.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  server.get('/stats', getDashboardStatsHandler);
}
