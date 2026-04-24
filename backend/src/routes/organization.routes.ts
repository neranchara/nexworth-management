import { FastifyInstance } from 'fastify';
import { createOrganizationHandler, listOrganizationsHandler } from '../controllers/organization.controller.js';

export default async function organizationRoutes(server: FastifyInstance) {
  server.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  server.post('/', createOrganizationHandler);
  server.get('/', listOrganizationsHandler);
}
