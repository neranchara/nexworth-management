import { FastifyInstance } from 'fastify';
import { loginHandler, meHandler, logoutHandler, generateLinePairingCodeHandler } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function authRoutes(server: FastifyInstance) {
  const isStaging = process.env.NODE_ENV === 'staging';

  server.post('/login', {
    config: {
      rateLimit: {
        max: isStaging ? 50 : 5,
        timeWindow: '1 minute'
      }
    }
  }, loginHandler);
  server.post('/logout', { preHandler: authenticate }, logoutHandler);
  server.get('/me', { preHandler: authenticate }, meHandler);
  server.post('/line-pairing-code', { preHandler: authenticate }, generateLinePairingCodeHandler);
}
