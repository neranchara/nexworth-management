import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardCockpitHandler } from '../dashboard.controller';
import { prisma } from '../../lib/prisma';

// Mock Prisma client
vi.mock('../../lib/prisma', () => ({
  prisma: {
    account: { findMany: vi.fn() },
    transaction: { findMany: vi.fn() },
    loan: { findMany: vi.fn() },
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    goal: { findMany: vi.fn() }
  }
}));

describe('Dashboard Controller - getDashboardCockpitHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data in parallel and return the cockpit financial stats', async () => {
    // 1. Setup Mock Data
    const mockAccounts = [
      { id: '1', name: 'Savings Account', type: 'BANK', isPersonal: true, asset: { amount: 50000 } },
      { id: '2', name: 'Credit Card', type: 'LIABILITY', isPersonal: true, liability: { amount: -15000 } }
    ];
    
    const mockTransactions = [
      { 
        id: 'tx1', 
        amount: 20000, 
        date: new Date('2026-05-01T10:00:00Z'), 
        type: { behavior: 'INCOME' },
        account: { type: 'BANK' }
      }
    ];

    (prisma.account.findMany as any).mockResolvedValue(mockAccounts);
    (prisma.transaction.findMany as any).mockResolvedValue(mockTransactions);
    (prisma.loan.findMany as any).mockResolvedValue([]);
    (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1', name: 'Nexworth Org' });

    // 2. Mock Fastify Request & Reply
    const request = {
      user: { sub: 'user-1', organizationId: 'org-1' },
      query: { year: '2026', month: '4' }, // May (0-indexed)
      log: { error: vi.fn() }
    } as any;

    const reply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    } as any;

    // 3. Execute Handler
    await getDashboardCockpitHandler(request, reply);

    // 4. Assertions
    // Verify parallel queries were executed
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      include: { asset: true, liability: true }
    });
    expect(prisma.transaction.findMany).toHaveBeenCalled();

    // Verify response payload
    expect(reply.send).toHaveBeenCalled();
    const responsePayload = reply.send.mock.calls[0][0];
    
    expect(responsePayload).toHaveProperty('currency', '฿');
    expect(responsePayload.summary).toHaveProperty('totalAssets', 50000);
    expect(responsePayload.summary).toHaveProperty('totalLiabilities', 15000);
    expect(responsePayload.summary).toHaveProperty('netWorth', 35000); // 50000 - 15000
    
    expect(responsePayload).toHaveProperty('health');
    expect(responsePayload).toHaveProperty('monthlyCashflow');
    expect(responsePayload).toHaveProperty('assetsByAccount');
  });

  it('should calculate cashflow health status correctly based on user settings', async () => {
    // 1. Setup Mock Data with SAFE status (Income 100k - Expense 10k = 90k > 70k safe zone)
    const mockAccounts = [
      { id: '1', name: 'Cashflow Account', type: 'CASHFLOW', isPersonal: true, asset: { amount: 85000 } }
    ];
    const mockTransactions = [
      { 
        id: 'tx1', amount: 100000, date: new Date('2026-05-01T10:00:00Z'), 
        type: { behavior: 'INCOME' }, account: { type: 'CASHFLOW' }
      },
      { 
        id: 'tx2', amount: 10000, date: new Date('2026-05-02T10:00:00Z'), 
        type: { behavior: 'EXPENSE' }, account: { type: 'CASHFLOW' }
      }
    ];

    (prisma.account.findMany as any).mockResolvedValue(mockAccounts);
    (prisma.transaction.findMany as any).mockResolvedValue(mockTransactions);
    (prisma.goal.findMany as any).mockResolvedValue([]);
    (prisma.user.findUnique as any).mockResolvedValue({ 
      id: 'user-1', liquidityDangerZone: 30000, liquiditySafeZone: 70000 
    });

    const request = {
      user: { sub: 'user-1', organizationId: 'org-1' },
      query: { year: '2026', month: '4' }, // May
      log: { info: vi.fn(), error: vi.fn() }
    } as any;

    const reply = { send: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis() } as any;

    await getDashboardCockpitHandler(request, reply);

    const responsePayload = reply.send.mock.calls[0][0];
    expect(responsePayload.summary.cashflowStatus).toBe('SAFE');
    expect(responsePayload.summary.liquiditySafeZone).toBe(70000);
    expect(responsePayload.summary.liquidityDangerZone).toBe(30000);
  });

  it('should handle errors gracefully and return 500 status', async () => {
    // Force an error
    (prisma.account.findMany as any).mockRejectedValue(new Error('Database timeout'));

    const request = {
      user: { sub: 'user-1', organizationId: 'org-1' },
      query: {},
      log: { error: vi.fn() }
    } as any;

    const reply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    } as any;

    await getDashboardCockpitHandler(request, reply);

    // Verify error handling
    expect(request.log.error).toHaveBeenCalled();
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
