import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { sendInvitationHandler, acceptInvitationHandler, getInvitationsHandler, revokeInvitationHandler } from '../controllers/invitation.controller';

export default async function invitationRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.post('/', { preHandler: [requireRole(['Admin', 'Owner'])] }, sendInvitationHandler);
  server.post('/accept', acceptInvitationHandler);
  server.get('/', { preHandler: [requireRole(['Admin', 'Owner'])] }, getInvitationsHandler);
  server.delete('/:id', { preHandler: [requireRole(['Admin', 'Owner'])] }, revokeInvitationHandler);
}

