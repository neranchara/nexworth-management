import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Audit Log Middleware
prisma.$use(async (params, next) => {
  const isMutation = ['create', 'update', 'delete', 'updateMany', 'deleteMany'].includes(params.action);
  
  if (!isMutation || params.model === 'AuditLog') {
    return next(params);
  }

  let oldValue: any = null;
  
  // Capture old value before the change (for update/delete)
  if (['update', 'delete'].includes(params.action)) {
    try {
      oldValue = await (prisma as any)[params.model!].findUnique({
        where: params.args.where
      });
    } catch (e) {
      console.warn(`[AuditLog] Failed to fetch old value for ${params.model}:`, e);
    }
  }

  const result = await next(params);

  // Record AuditLog asynchronously to not block the main request
  // Note: For 'create', result IS the new value. For 'update', result is also the new value.
  const recordLog = async () => {
    try {
      await prisma.auditLog.create({
        data: {
          action: params.action.toUpperCase(),
          entity: params.model || 'Unknown',
          entityId: result?.id || params.args?.where?.id || 'N/A',
          organizationId: result?.organizationId || oldValue?.organizationId || null,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: result ? JSON.parse(JSON.stringify(result)) : null,
          performedBy: 'SYSTEM', // Context like current user should be passed via headers in future
        },
      });
    } catch (err) {
      console.error("[AuditLog] Error recording log:", err);
    }
  };

  if (['create', 'update', 'delete'].includes(params.action)) {
    recordLog();
  }

  return result;
});

export { prisma };
export default prisma;
