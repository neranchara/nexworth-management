import { FastifyInstance } from 'fastify';
import { loginHandler, meHandler, logoutHandler, generateLinePairingCodeHandler } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { config } from '../config/index.js';

export default async function authRoutes(server: FastifyInstance) {
  server.post('/login', {
    config: {
      rateLimit: {
        max: config.authRateLimit.max,
        timeWindow: config.authRateLimit.timeWindow
      }
    }
  }, loginHandler);
  server.post('/logout', { preHandler: authenticate }, logoutHandler);
  server.get('/me', { preHandler: authenticate }, meHandler);
  server.post('/line-pairing-code', { preHandler: authenticate }, generateLinePairingCodeHandler);
}
