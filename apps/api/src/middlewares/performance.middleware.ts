import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

/**
 * Performance Interceptor for API Response Time Tracking
 * Story: SAM1-9-1
 */

export const performanceRequestHook = async (request: FastifyRequest) => {
  (request as any).startTime = Date.now();
};

export const performanceResponseHook = async (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = (request as any).startTime;
  if (!startTime) return;

  const duration = Date.now() - startTime;

  // We only log internal API calls to avoid spamming system logs with static/health checks
  if (request.url.startsWith('/api/v1') && !request.url.includes('/health')) {
    // Log performance asynchronously to not block the response
    prisma.systemLog.create({
      data: {
        type: 'performance',
        tag: 'api-response',
        payload: {
          path: request.url.split('?')[0], // Strip query params for cleaner aggregation
          method: request.method,
          durationMs: duration,
          statusCode: reply.raw?.statusCode || reply.statusCode,
          timestamp: new Date().toISOString()
        }
      }
    }).catch(err => {
       // Silent catch to prevent performance logging from crashing the app
       // but we log it to console for dev awareness
       if (process.env.NODE_ENV !== 'production') {
         console.warn('[PerformanceMiddleware] Logging failed:', err.message);
       }
    });
  }
};
