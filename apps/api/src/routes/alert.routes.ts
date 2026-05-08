import { FastifyInstance } from 'fastify';
import { notificationService } from '../services/notification.service';

/**
 * Alert Routes (Phase 1.2)
 * Hub for manual alerts and connection testing.
 */
export async function alertRoutes(fastify: FastifyInstance) {
  
  // POST /api/v1/admin/alerts/test
  // Manual trigger to test LINE connection
  fastify.post('/test', async (request, reply) => {
    const { message } = request.body as { message?: string };
    
    await notificationService.sendSecurityAlert(
      message || 'Testing LINE Notification Hub connection from Admin Console.'
    );
    
    return { 
      success: true, 
      message: 'Test alert sent to LINE Admin Group' 
    };
  });
}
