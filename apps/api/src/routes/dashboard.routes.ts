import { FastifyInstance } from 'fastify';
import { getDashboardStatsHandler } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function dashboardRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.get('/stats', getDashboardStatsHandler);
}
