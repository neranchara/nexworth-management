import { FastifyInstance } from 'fastify';
import { getDashboardStatsHandler, getDashboardCockpitHandler } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function dashboardRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.get('/stats', getDashboardStatsHandler);
  server.get('/cockpit', getDashboardCockpitHandler);
}
