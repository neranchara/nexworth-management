import { FastifyInstance } from 'fastify';
import { 
  loginHandler, 
  registerHandler,
  meHandler, 
  logoutHandler, 
  generateLinePairingCodeHandler, 
  getPublicKeyHandler, 
  requestPasswordResetHandler, 
  verifyResetTokenHandler, 
  resetPasswordHandler 
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { config } from '../config/index';

export default async function authRoutes(server: FastifyInstance) {
  server.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour'
      }
    }
  }, registerHandler);

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
  server.get('/public-key', getPublicKeyHandler);
  server.post('/line-pairing-code', { preHandler: authenticate }, generateLinePairingCodeHandler);
  
  // Password Reset Routes
  server.post('/request-password-reset', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15m'
      }
    }
  }, requestPasswordResetHandler);
  server.get('/verify-reset-token', verifyResetTokenHandler);
  server.post('/reset-password', resetPasswordHandler);
}
