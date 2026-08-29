import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as aiExtractionService from '../services/aiExtractionService.js';
import { prisma } from '../lib/prisma.js';

describe('AI Telemetry Integration', () => {
  beforeEach(async () => {
    // No longer clearing logs to preserve staging environment data
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should log telemetry to database when extractFromText is called', async () => {
    // Ensure we are in mock mode or have a key
    process.env.USE_AI_MOCK = 'true';

    const text = "โอนเงิน 500 บาท ค่าอาหาร";
    const result = await aiExtractionService.extractFromText(text);

    expect(result).toBeDefined();
    expect(result.telemetry).toBeDefined();

    // Verify DB entry
    const logs = await prisma.systemLog.findMany({
      where: { type: 'telemetry', tag: 'ai-engine' }
    });

    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[logs.length - 1];
    expect((lastLog.payload as any).model).toBeDefined();
    expect((lastLog.payload as any).latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should log mock telemetry for diagnosis fallback', async () => {
    process.env.NODE_ENV = 'staging'; // Force mock mode in service logic
    
    const result = await aiExtractionService.diagnoseUserHealth([], []);

    expect(result.telemetry.model).toBe('mock-engine');

    const log = await prisma.systemLog.findFirst({
      where: { 
        type: 'telemetry', 
        tag: 'ai-engine',
        payload: {
          path: ['model'],
          equals: 'mock-engine'
        }
      }
    });

    // Fallback check if Json path query is not supported in this prisma version/env
    const allLogs = await prisma.systemLog.findMany({
      where: { type: 'telemetry', tag: 'ai-engine' }
    });
    const hasMockLog = allLogs.some(l => (l.payload as any).model === 'mock-engine');
    expect(hasMockLog).toBe(true);
  });
});
