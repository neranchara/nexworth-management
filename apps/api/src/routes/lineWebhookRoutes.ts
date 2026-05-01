import { FastifyInstance } from 'fastify';
import * as lineWebhookController from '../controllers/lineWebhookController.js';

export default async function lineWebhookRoutes(fastify: FastifyInstance) {
  // LINE Webhook Endpoint
  // Note: LINE requires signature validation, but for simple MVP we can rely on standard fastify body parsing
  // To do strict validation, fastify-raw-body would be needed. 
  fastify.post('/', lineWebhookController.handleWebhook);
}
