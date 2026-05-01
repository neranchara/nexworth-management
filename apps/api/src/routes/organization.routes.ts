import { FastifyInstance } from 'fastify';
import { createOrganizationHandler, listOrganizationsHandler, updateOrganizationHandler } from '../controllers/organization.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function organizationRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.post('/', createOrganizationHandler);
  server.get('/', listOrganizationsHandler);
  server.put('/:id', updateOrganizationHandler);
}
