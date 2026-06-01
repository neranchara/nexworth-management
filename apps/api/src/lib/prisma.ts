import { PrismaClient } from '@prisma/client';
import { getContext } from './context';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Audit Log Middleware
prisma.$use(async (params, next) => {
  const isMutation = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert'].includes(params.action);
  
  if (!isMutation || params.model === 'AuditLog' || params.model === 'Session' || params.model === 'ImpersonationLog') {
    return next(params);
  }

  let oldValue: any = null;
  const context = getContext();
  
  // Capture old value before the change (only for single entity updates/deletes)
  if (['update', 'delete'].includes(params.action) && params.args?.where?.id) {
    try {
      oldValue = await (prisma as any)[params.model!].findUnique({
        where: params.args.where
      });
    } catch (e) {
      // Ignore if not found or error
    }
  }

  const result = await next(params);

  // Record AuditLog asynchronously
  const recordLog = async () => {
    const entityId = result?.id || params.args?.where?.id || 'BATCH';
    const orgId = result?.organizationId || oldValue?.organizationId || null;

    const logData = {
      action: params.action.toUpperCase(),
      entity: params.model || 'Unknown',
      entityId: String(entityId),
      organizationId: orgId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: result && !['delete', 'deleteMany'].includes(params.action) ? JSON.parse(JSON.stringify(result)) : null,
      performedBy: context?.userId || 'SYSTEM',
      ipAddress: context?.ip || null,
      userAgent: null,
    };

    try {
      await prisma.auditLog.create({ data: logData });
    } catch (err: any) {
      // FK violation on organizationId (org deleted/not found) — retry with null
      if (err?.code === 'P2003' && err?.meta?.field_name?.includes('organizationId')) {
        try {
          await prisma.auditLog.create({ data: { ...logData, organizationId: null } });
        } catch (retryErr) {
          console.error('[AuditLog] Failed to record log (retry):', retryErr);
        }
        return;
      }
      console.error('[AuditLog] Error recording log:', err);
    }
  };

  // Only record single-entity mutations for now to avoid huge log payloads from Many operations
  if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
    recordLog();
  }

  return result;
});

export { prisma };
export default prisma;
