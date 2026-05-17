import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware';
import { sendInvitationHandler, acceptInvitationHandler, getInvitationsHandler } from '../controllers/invitation.controller';

export default async function invitationRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  server.post('/', sendInvitationHandler);
  server.post('/accept', acceptInvitationHandler);
  server.get('/', getInvitationsHandler);
}
