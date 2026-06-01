import { FastifyRequest, FastifyReply } from 'fastify';
import * as aiExtractionService from '../services/aiExtractionService.js';

export const extractTransaction = async (request: FastifyRequest, reply: FastifyReply) => {
  const { text, image, mimeType } = request.body as { text?: string, image?: string, mimeType?: string };

  try {
    if (text) {
      const result = await aiExtractionService.extractFromText(text);
      return reply.send({ success: true, data: result.data, telemetry: result.telemetry });
    }

    if (image && mimeType) {
      const buffer = Buffer.from(image, 'base64');
      const result = await aiExtractionService.extractFromImage(buffer, mimeType);
      return reply.send({ success: true, data: result.data, telemetry: result.telemetry });
    }

    return reply.status(400).send({ success: false, error: 'Provide either text or base64 image with mimeType' });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message || 'AI Extraction failed' });
  }
};

export const scanSlipHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (process.env.NODE_ENV !== 'test') console.log('[AI Controller] Incoming headers:', JSON.stringify(request.headers));
    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/png';

    // Robust handling: iterate through all parts to find the file
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer();
        mimeType = part.mimetype;
        if (process.env.NODE_ENV !== 'test') console.log(`[AI Controller] Received file: ${part.filename} (${mimeType}, ${fileBuffer.length} bytes)`);
        break; // Take the first file
      }
    }
    
    if (!fileBuffer || fileBuffer.length === 0) {
      if (process.env.NODE_ENV !== 'test') console.warn('[AI Controller] No file content detected in multipart request.');
      return reply.status(400).send({ success: false, error: 'No slip image content detected.' });
    }

    const result = await aiExtractionService.extractFromImage(fileBuffer, mimeType);

    return reply.send({ 
      success: true, 
      data: result.data,
      telemetry: result.telemetry
    });
  } catch (error: any) {
    console.error('[AI Controller] Slip scanning failed:', error.message || error);
    
    const statusCode = error.message?.includes('Quota') ? 429 : 500;
    return reply.status(statusCode).send({ 
      success: false, 
      error: error.message || 'Internal Server Error during slip scanning' 
    });
  }
};

export const diagnoseUserHealth = async (request: FastifyRequest, reply: FastifyReply) => {
  const { metrics, findings } = request.body as { metrics: any[], findings: any[] };

  try {
    const result = await aiExtractionService.diagnoseUserHealth(metrics, findings);
    return reply.send({ success: true, data: result.data, telemetry: result.telemetry });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message || 'AI Diagnosis failed' });
  }
};
