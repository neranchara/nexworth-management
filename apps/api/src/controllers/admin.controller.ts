import { FastifyRequest, FastifyReply } from 'fastify';
import { adminService } from '../services/admin.service.js';

export const executeFixes = async (request: FastifyRequest, reply: FastifyReply) => {
  const { fixes, targetId } = request.body as { 
    fixes: { type: string; payload: any }[]; 
    targetId: string;
  };

  if (!fixes || !Array.isArray(fixes)) {
    return reply.status(400).send({ success: false, error: 'Invalid fixes array' });
  }

  const results = [];

  try {
    for (const fix of fixes) {
      let result;
      switch (fix.type) {
        case 'reconcile_account':
          // Enhanced user detection: check flag, prefix, or email pattern
          const id = fix.payload?.accountId || targetId;
          const isUserTarget = fix.payload?.isUser || 
                               id.startsWith('USR-') || 
                               id.includes('@') || 
                               id.length > 30; // UUIDs are typically > 30 chars

          if (isUserTarget) {
            result = await adminService.reconcileUserAccounts(id);
          } else {
            result = await adminService.reconcileAccountBalance(id);
          }
          results.push({ type: fix.type, status: 'success', data: result });
          break;
        
        case 'sanitize_dates':
          // organizationId is usually the targetId in org context
          result = await adminService.sanitizeTransactionDates(targetId);
          results.push({ type: fix.type, status: 'success', data: result });
          break;

        default:
          results.push({ type: fix.type, status: 'ignored', message: 'Unknown fix type' });
      }
    }

    return reply.send({ success: true, data: results });
  } catch (error: any) {
    console.error('Execute fixes failed:', error);
    return reply.status(500).send({ success: false, error: error.message || 'Bulk fix execution failed' });
  }
};
