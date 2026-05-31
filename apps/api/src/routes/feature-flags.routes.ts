import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { listFeaturesHandler, updateFeatureHandler, seedDefaultFlagsHandler } from '../controllers/feature-flags.controller.js';

export default async function featureFlagsRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.get('/', listFeaturesHandler);
  server.put('/:name', updateFeatureHandler);
  server.post('/seed', seedDefaultFlagsHandler);
}
