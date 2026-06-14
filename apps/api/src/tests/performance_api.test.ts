import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';
import * as performanceService from '../services/performanceService.js';

describe('Performance Service & API', () => {
  beforeEach(async () => {
    // Ensure we have at least some test data without wiping the staging logs
    const testPath = '/api/v1/test-performance-check';
    const logs = await prisma.systemLog.findMany({
      where: { type: 'performance' }
    });
    const existing = logs.filter(l => (l.payload as any).path === testPath);

    if (existing.length > 0) {
      await prisma.systemLog.deleteMany({
        where: { id: { in: existing.map(e => e.id) } }
      });
    }

    await prisma.systemLog.create({
      data: {
        type: 'performance',
        tag: 'api-response',
        payload: { path: testPath, durationMs: 999999, statusCode: 200 }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should correctly aggregate API latency', async () => {
    const metrics = await performanceService.getPerformanceMetrics();
    
    expect(metrics.totalRequests).toBeGreaterThan(0);
    const testMetric = metrics.apiLatency.find(l => l.path === '/api/v1/test-performance-check');
    expect(testMetric).toBeDefined();
    expect(testMetric?.avgLatency).toBe(999999);
  });
});
