import { FastifyInstance } from 'fastify';
import * as aiController from '../controllers/ai.controller.js';

export default async function aiRoutes(fastify: FastifyInstance) {
  // Central AI Extraction Endpoint
  fastify.post('/extract', aiController.extractTransaction);
}
