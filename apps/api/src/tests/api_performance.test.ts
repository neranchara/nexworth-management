import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';
import axios from 'axios';
import { buildServer } from '../server.js';

// Integration test for API Performance Logging
describe('API Performance Interceptor', () => {
  let server: any;

  beforeEach(async () => {
    // No longer clearing logs to preserve staging environment data
    server = await buildServer();
  });

  afterAll(async () => {
    if (server) await server.close();
    await prisma.$disconnect();
  });

  it('should log performance data when a public API is called', async () => {
    const testStartTime = new Date(Date.now() - 1000); // 1 second buffer before request

    // Hit a real route using fastify inject
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me'
    });


    // Wait a bit longer for background logging to complete (asynchronous prisma.create)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const logs = await prisma.systemLog.findMany({
      where: { 
        type: 'performance', 
        tag: 'api-response',
        createdAt: {
          gte: testStartTime
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const targetLog = logs.find(l => (l.payload as any).path?.includes('/api/v1/auth/me'));
    
    if (!targetLog) {
      console.error('[Test Error] Performance log not found in DB. Logs found:', JSON.stringify(logs, null, 2));
    }
    
    expect(targetLog).toBeDefined();
    expect((targetLog!.payload as any).durationMs).toBeGreaterThanOrEqual(0);
    expect((targetLog!.payload as any).statusCode).toBe(401);
  });
});
