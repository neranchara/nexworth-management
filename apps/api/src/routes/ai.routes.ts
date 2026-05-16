import { FastifyInstance } from 'fastify';
import * as aiController from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function aiRoutes(fastify: FastifyInstance) {
  // All AI routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Central AI Extraction Endpoint (JSON)
  fastify.post('/extract', aiController.extractTransaction);

  /**
   * 4.2 AI Slip Scanner (Multipart)
   * Handles bank slip image uploads directly.
   */
  fastify.post('/scan-slip', aiController.scanSlipHandler);

  /**
   * 4.3 QR Slip Verification (SA Best Practice)
   * Handles pre-extracted QR payloads.
   */
  fastify.post('/verify-slip', async (request, reply) => {
    const { payload } = request.body as { payload: string };
    const { verificationService } = await import('../services/verification.service.js');
    const result = await verificationService.verifySlipPayload(payload);
    return reply.send(result);
  });

  /**
   * 4.1 AI Diagnosis Engine
   * BA Requirement: Intelligent Ops Insights
   */
  fastify.post('/diagnose', aiController.diagnoseUserHealth);
}
