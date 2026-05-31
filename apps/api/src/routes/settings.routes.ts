import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getBenchmarksHandler, updateBenchmarksHandler } from '../controllers/settings.controller.js';

export default async function settingsRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.get('/benchmarks', getBenchmarksHandler);
  server.put('/benchmarks', updateBenchmarksHandler);
}
