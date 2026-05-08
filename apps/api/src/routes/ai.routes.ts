import { FastifyInstance } from 'fastify';
import * as aiController from '../controllers/ai.controller.js';

export default async function aiRoutes(fastify: FastifyInstance) {
  // Central AI Extraction Endpoint
  fastify.post('/extract', aiController.extractTransaction);

  /**
   * 4.1 AI Diagnosis Engine
   * BA Requirement: Intelligent Ops Insights
   */
  fastify.post('/diagnose', aiController.diagnoseUserHealth);
}
