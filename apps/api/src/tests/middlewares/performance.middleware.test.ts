import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performanceRequestHook, performanceResponseHook } from '../../middlewares/performance.middleware';
import { prisma } from '../../lib/prisma';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    systemLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' })
    }
  }
}));

describe('Performance Middleware Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('performanceRequestHook should attach startTime to the request', async () => {
    const mockRequest = {} as any;
    const startTime = 1000;
    vi.setSystemTime(startTime);

    await performanceRequestHook(mockRequest);

    expect(mockRequest.startTime).toBe(startTime);
  });

  it('performanceResponseHook should log performance for valid API paths', async () => {
    const startTime = 1000;
    const endTime = 1500;
    const mockRequest = {
      startTime,
      url: '/api/v1/dashboard/cockpit',
      method: 'GET'
    } as any;
    
    const mockReply = {
      statusCode: 200
    } as any;

    vi.setSystemTime(endTime);

    await performanceResponseHook(mockRequest, mockReply);

    // Verify Prisma create was called
    expect(prisma.systemLog.create).toHaveBeenCalled();
    const callArgs = (prisma.systemLog.create as any).mock.calls[0][0];
    
    expect(callArgs.data.type).toBe('performance');
    expect(callArgs.data.payload.durationMs).toBe(endTime - startTime);
    expect(callArgs.data.payload.path).toBe('/api/v1/dashboard/cockpit');
    expect(callArgs.data.payload.method).toBe('GET');
  });

  it('performanceResponseHook should NOT log for health check paths', async () => {
    const mockRequest = {
      startTime: Date.now(),
      url: '/api/v1/health',
      method: 'GET'
    } as any;
    
    const mockReply = { statusCode: 200 } as any;

    await performanceResponseHook(mockRequest, mockReply);

    expect(prisma.systemLog.create).not.toHaveBeenCalled();
  });

  it('performanceResponseHook should NOT log for non-API paths', async () => {
    const mockRequest = {
      startTime: Date.now(),
      url: '/static/image.png',
      method: 'GET'
    } as any;
    
    const mockReply = { statusCode: 200 } as any;

    await performanceResponseHook(mockRequest, mockReply);

    expect(prisma.systemLog.create).not.toHaveBeenCalled();
  });

  it('performanceResponseHook should handle missing startTime gracefully', async () => {
    const mockRequest = {
      url: '/api/v1/data',
      method: 'POST'
    } as any;
    
    const mockReply = { statusCode: 201 } as any;

    await performanceResponseHook(mockRequest, mockReply);

    expect(prisma.systemLog.create).not.toHaveBeenCalled();
  });

  it('performanceResponseHook should strip query parameters from the path', async () => {
    const mockRequest = {
      startTime: 1000,
      url: '/api/v1/transactions?month=5&year=2026',
      method: 'GET'
    } as any;
    
    const mockReply = { statusCode: 200 } as any;

    vi.setSystemTime(1200);

    await performanceResponseHook(mockRequest, mockReply);

    const callArgs = (prisma.systemLog.create as any).mock.calls[0][0];
    expect(callArgs.data.payload.path).toBe('/api/v1/transactions');
  });
});
