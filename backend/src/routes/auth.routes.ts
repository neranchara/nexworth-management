import { FastifyInstance } from 'fastify';
import { loginHandler, meHandler, logoutHandler } from '../controllers/auth.controller.js';

export default async function authRoutes(server: FastifyInstance) {
  server.post('/login', loginHandler);
  server.post('/logout', logoutHandler);
  server.get('/me', meHandler);
}
