import { FastifyReply, FastifyRequest } from 'fastify';
import { notificationService } from '../services/notification.service';

/**
 * Impersonation Guard (ISP Policy 1)
 * Enforces Read-only access for Admin in View-As mode.
 */
export async function impersonationGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;

  // If the token was generated for Impersonation (View-As)
  if (user && user.isImpersonated) {
    // ISP Policy 1: Block all mutation methods
    const forbiddenMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (forbiddenMethods.includes(request.method)) {
      const alertMsg = `Admin ${user.impersonatorId} attempted ${request.method} on User ${user.id} at ${request.url}`;
      if (process.env.NODE_ENV !== 'test') console.warn(`[ImpersonationGuard] Blocked: ${alertMsg}`);
      
      // Async trigger alert
      notificationService.sendSecurityAlert(alertMsg);

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Impersonation Mode: Read-only access enforced. Action not allowed.'
      });
    }
    
    console.log(`[ImpersonationGuard] Read-only access allowed for Admin ${user.impersonatorId} viewing User ${user.id}`);
  }
}
