import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listGoalsHandler, getGoalsSummaryHandler } from '../../controllers/goal.controller';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    goal: { findMany: vi.fn() },
    account: { findMany: vi.fn() },
    monthlyFinancialSnapshot: { findMany: vi.fn() },
    transaction: { aggregate: vi.fn() }
  }
}));

function makeReply() {
  return {
    send: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis()
  } as any;
}

describe('Goal Controller - NEX-BUG-14 virtual goals fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listGoalsHandler', () => {
    it('returns real Goal rows as-is when they exist, without touching accounts', async () => {
      (prisma.goal.findMany as any).mockResolvedValue([
        { id: 'g1', name: 'บ้าน', targetAmount: 1000000, allocations: [{ allocatedAmount: 200000 }] }
      ]);

      const request = { user: { sub: 'u1', organizationId: 'org-1' } } as any;
      const reply = makeReply();

      await listGoalsHandler(request, reply);

      expect(prisma.account.findMany).not.toHaveBeenCalled();
      const payload = reply.send.mock.calls[0][0];
      expect(payload.goals).toHaveLength(1);
      expect(payload.goals[0]).toMatchObject({ id: 'g1', currentAmount: 200000, progressPercentage: 20 });
    });

    it('falls back to GOAL/GOAL_SAVING accounts when the org has no real Goal rows', async () => {
      (prisma.goal.findMany as any).mockResolvedValue([]);
      (prisma.account.findMany as any).mockResolvedValue([
        { id: 'acc1', name: 'Cloud Pocket เที่ยว', type: 'GOAL', targetAmount: 30000, asset: { amount: 3000 } },
        { id: 'acc2', name: 'ออมสิน บัญชีเงินซื้อรถ', type: 'GOAL', targetAmount: 350000, asset: { amount: 282532.08 } }
      ]);

      const request = { user: { sub: 'u1', organizationId: 'org-1' } } as any;
      const reply = makeReply();

      await listGoalsHandler(request, reply);

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', type: { in: ['GOAL', 'GOAL_SAVING'] } },
        include: { asset: true }
      });
      const payload = reply.send.mock.calls[0][0];
      expect(payload.goals).toHaveLength(2);
      expect(payload.goals[0]).toMatchObject({ id: 'acc1', currentAmount: 3000, targetAmount: 30000, isVirtual: true });
      expect(payload.goals[1]).toMatchObject({ id: 'acc2', currentAmount: 282532.08, targetAmount: 350000, isVirtual: true });
    });

    it('returns an empty list when there are neither real goals nor goal-type accounts', async () => {
      (prisma.goal.findMany as any).mockResolvedValue([]);
      (prisma.account.findMany as any).mockResolvedValue([]);

      const request = { user: { sub: 'u1', organizationId: 'org-1' } } as any;
      const reply = makeReply();

      await listGoalsHandler(request, reply);

      const payload = reply.send.mock.calls[0][0];
      expect(payload.goals).toEqual([]);
    });
  });

  describe('getGoalsSummaryHandler', () => {
    it('aggregates totals from virtual goal accounts when no ACTIVE real goals exist', async () => {
      (prisma.goal.findMany as any).mockResolvedValue([]);
      (prisma.account.findMany as any).mockResolvedValue([
        { id: 'acc1', name: 'Cloud Pocket เที่ยว', type: 'GOAL', targetAmount: 30000, asset: { amount: 3000 } },
        { id: 'acc2', name: 'Cloud Pocket ทำบุญ', type: 'GOAL', targetAmount: 3600, asset: { amount: 2000 } }
      ]);
      (prisma.monthlyFinancialSnapshot.findMany as any).mockResolvedValue([]);
      (prisma.transaction.aggregate as any).mockResolvedValue({ _sum: { amount: 0 } });

      const request = { user: { sub: 'u1', organizationId: 'org-1' } } as any;
      const reply = makeReply();

      await getGoalsSummaryHandler(request, reply);

      const payload = reply.send.mock.calls[0][0];
      expect(payload.summary.goalCount).toBe(2);
      expect(payload.summary.totalGoalsValue).toBe(33600);
      expect(payload.summary.totalCollected).toBe(5000);
    });
  });
});
