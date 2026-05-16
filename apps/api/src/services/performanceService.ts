import { prisma } from '../lib/prisma.js';

export const getPerformanceMetrics = async () => {
  // Since Prisma groupBy has limitations on Json fields, we fetch recent logs and process in memory
  const recentLogs = await prisma.systemLog.findMany({
    where: { 
      type: { in: ['performance', 'telemetry'] } 
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  const processed = {
    apiLatency: [] as any[],
    aiLatency: [] as any[],
    errorRates: 0,
    totalRequests: recentLogs.length
  };

  const latencyByPath: Record<string, { total: number, count: number }> = {};
  const aiLatencyByModel: Record<string, { total: number, count: number }> = {};

  recentLogs.forEach(log => {
    const payload = log.payload as any;
    if (log.type === 'performance' && log.tag === 'api-response') {
      const path = payload.path || 'unknown';
      if (!latencyByPath[path]) latencyByPath[path] = { total: 0, count: 0 };
      latencyByPath[path].total += payload.durationMs || 0;
      latencyByPath[path].count += 1;
      
      if (payload.statusCode >= 400) processed.errorRates += 1;
    } else if (log.type === 'telemetry' && log.tag === 'ai-engine') {
      const model = payload.model || 'unknown';
      if (!aiLatencyByModel[model]) aiLatencyByModel[model] = { total: 0, count: 0 };
      aiLatencyByModel[model].total += payload.latencyMs || 0;
      aiLatencyByModel[model].count += 1;
    }
  });

  processed.apiLatency = Object.entries(latencyByPath).map(([path, data]) => ({
    path,
    avgLatency: Math.round(data.total / data.count),
    count: data.count
  })).sort((a, b) => b.avgLatency - a.avgLatency).slice(0, 10);

  processed.aiLatency = Object.entries(aiLatencyByModel).map(([model, data]) => ({
    model,
    avgLatency: Math.round(data.total / data.count),
    count: data.count
  }));

  if (processed.totalRequests > 0) {
    processed.errorRates = parseFloat(((processed.errorRates / processed.totalRequests) * 100).toFixed(2));
  }

  return processed;
};
