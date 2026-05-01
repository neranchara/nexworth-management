import { FastifyRequest, FastifyReply } from 'fastify';
import * as aiExtractionService from '../services/aiExtractionService.js';

export const extractTransaction = async (request: FastifyRequest, reply: FastifyReply) => {
  const { text, image, mimeType } = request.body as { text?: string, image?: string, mimeType?: string };

  try {
    if (text) {
      const result = await aiExtractionService.extractFromText(text);
      return reply.send({ success: true, data: result });
    }

    if (image && mimeType) {
      const buffer = Buffer.from(image, 'base64');
      const result = await aiExtractionService.extractFromImage(buffer, mimeType);
      return reply.send({ success: true, data: result });
    }

    return reply.status(400).send({ success: false, error: 'Provide either text or base64 image with mimeType' });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message || 'AI Extraction failed' });
  }
};
