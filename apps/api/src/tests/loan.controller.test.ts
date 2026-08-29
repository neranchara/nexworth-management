/**
 * Unit Tests: Loan Controller
 *
 * ทดสอบ business logic ของ handler แต่ละตัว โดย mock prisma ทั้งหมด
 * ไม่ต้องการ DB จริง — เร็วและ isolated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listLoansHandler,
  createLoanHandler,
  addLoanTransactionHandler,
  updateLoanHandler,
} from '../controllers/loan.controller';

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
vi.mock('../lib/prisma', () => ({
  prisma: {
    loan: {
      findMany:  vi.fn(),
      findUnique: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      count:     vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
    },
    asset: {
      findUnique: vi.fn(),
      upsert:     vi.fn(),
    },
    liability: {
      findUnique: vi.fn(),
    },
    transactionCategory: {
      findFirst: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
    },
    transactionType: {
      findFirst: vi.fn(),
      create:    vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeReq = (overrides: Record<string, any> = {}) => ({
  user:   { sub: 'user-1', organizationId: 'org-1' },
  query:  {},
  params: {},
  body:   {},
  log:    { error: vi.fn() },
  ...overrides,
});

const makeReply = () => {
  const reply: any = {};
  reply.send   = vi.fn().mockReturnValue(reply);
  reply.status = vi.fn().mockReturnValue(reply);
  return reply;
};

// UUIDs จำลอง — ต้องเป็น RFC 4122 v4 (version=4, variant=8-b) เพื่อผ่าน z.string().uuid()
const ACC_ID    = '550e8400-e29b-41d4-a716-446655440001';
const ASSET_ID  = '550e8400-e29b-41d4-a716-446655440002';
const LOAN_ID   = '550e8400-e29b-41d4-a716-446655440003';
const OTHER_ORG = '550e8400-e29b-41d4-a716-446655440099';

const mockCat = {
  id:     'cat-1',
  typeId: 'type-1',
  type:   { id: 'type-1', behavior: 'LOAN_BORROW' },
};

// ---------------------------------------------------------------------------
// listLoansHandler
// ---------------------------------------------------------------------------
describe('listLoansHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all loans with computed status ACTIVE when balance > 0', async () => {
    const loan = {
      id:          'loan-1',
      code:        'L001',
      name:        'ทำบ้าน',
      direction:   'BORROW',
      borrowerName: null,
      accountId:   'acc-1',
      date:        new Date('2026-01-01'),
      actualDate:  null,
      createdAt:   new Date(),
      asset:       { account: { id: 'acc-1', name: 'กสิกร', bank: null } },
      liability:   null,
      transactions: [
        { amount: 50000, actualDate: null, date: new Date(), type: { behavior: 'LOAN_BORROW' }, category: { type: { behavior: 'LOAN_BORROW' } } },
        { amount: 10000, actualDate: null, date: new Date(), type: { behavior: 'LOAN_REPAY'  }, category: { type: { behavior: 'LOAN_REPAY'  } } },
      ],
    };

    (prisma.loan.findMany as any).mockResolvedValue([loan]);
    (prisma.account.findMany as any).mockResolvedValue([]);

    const req   = makeReq();
    const reply = makeReply();
    await listLoansHandler(req as any, reply as any);

    expect(reply.send).toHaveBeenCalledOnce();
    const { loans } = (reply.send as any).mock.calls[0][0];
    expect(loans[0].status).toBe('ACTIVE');
    expect(loans[0].totalBorrowed).toBe(50000);
    expect(loans[0].totalRepaid).toBe(10000);
    expect(loans[0].balance).toBe(40000);
  });

  it('returns status PAID when totalRepaid >= totalBorrowed', async () => {
    const loan = {
      id: 'loan-2', code: 'L002', name: 'Test', direction: 'BORROW', borrowerName: null,
      accountId: 'acc-1', date: new Date(), actualDate: null, createdAt: new Date(),
      asset: { account: { id: 'acc-1', name: 'ออมสิน', bank: null } }, liability: null,
      transactions: [
        { amount: 20000, actualDate: null, date: new Date(), type: { behavior: 'LOAN_BORROW' }, category: { type: { behavior: 'LOAN_BORROW' } } },
        { amount: 20000, actualDate: null, date: new Date(), type: { behavior: 'LOAN_REPAY'  }, category: { type: { behavior: 'LOAN_REPAY'  } } },
      ],
    };

    (prisma.loan.findMany as any).mockResolvedValue([loan]);
    (prisma.account.findMany as any).mockResolvedValue([]);

    const reply = makeReply();
    await listLoansHandler(makeReq() as any, reply as any);

    const { loans } = (reply.send as any).mock.calls[0][0];
    expect(loans[0].status).toBe('PAID');
  });

  it('falls back to direct account lookup for orphaned loans (บัญชีที่ถูกลบ fix)', async () => {
    const loan = {
      id: 'loan-3', code: 'L003', name: 'กู้เก่า', direction: 'BORROW', borrowerName: null,
      accountId: 'acc-deleted', date: new Date(), actualDate: null, createdAt: new Date(),
      asset: null, liability: null, transactions: [],
    };

    (prisma.loan.findMany as any).mockResolvedValue([loan]);
    (prisma.account.findMany as any).mockResolvedValue([{ id: 'acc-deleted', name: 'กสิกร (เก่า)' }]);

    const reply = makeReply();
    await listLoansHandler(makeReq() as any, reply as any);

    const { loans } = (reply.send as any).mock.calls[0][0];
    expect(loans[0].accountName).toBe('กสิกร (เก่า)');
  });

  it('returns "บัญชีที่ถูกลบ" when no account found at all', async () => {
    const loan = {
      id: 'loan-4', code: 'L004', name: 'หาย', direction: 'BORROW', borrowerName: null,
      accountId: 'acc-gone', date: new Date(), actualDate: null, createdAt: new Date(),
      asset: null, liability: null, transactions: [],
    };

    (prisma.loan.findMany as any).mockResolvedValue([loan]);
    (prisma.account.findMany as any).mockResolvedValue([]);

    const reply = makeReply();
    await listLoansHandler(makeReq() as any, reply as any);

    const { loans } = (reply.send as any).mock.calls[0][0];
    expect(loans[0].accountName).toBe('บัญชีที่ถูกลบ');
  });

  it('filters by direction query param', async () => {
    (prisma.loan.findMany as any).mockResolvedValue([]);
    (prisma.account.findMany as any).mockResolvedValue([]);

    await listLoansHandler(makeReq({ query: { direction: 'LEND' } }) as any, makeReply() as any);

    expect(prisma.loan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ direction: 'LEND' }) })
    );
  });
});

// ---------------------------------------------------------------------------
// createLoanHandler
// ---------------------------------------------------------------------------
describe('createLoanHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  const baseBody = {
    name:          'ยืมทำบ้าน',
    accountId:     ACC_ID,
    initialAmount: 50000,
    direction:     'BORROW',
  };

  it('generates L### code for BORROW loans', async () => {
    (prisma.account.findUnique as any).mockResolvedValue({ id: ACC_ID, type: 'BANK', userId: 'user-1', organizationId: 'org-1' });
    (prisma.loan.count as any).mockResolvedValue(2);
    (prisma.asset.findUnique as any).mockResolvedValue({ id: ASSET_ID });
    (prisma.loan.create as any).mockResolvedValue({ id: LOAN_ID, code: 'L003' });
    (prisma.transactionCategory.findFirst as any).mockResolvedValue(mockCat);
    (prisma.transaction.create as any).mockResolvedValue({});
    (prisma.asset.upsert as any).mockResolvedValue({});

    const reply = makeReply();
    await createLoanHandler(makeReq({ body: baseBody }) as any, reply as any);

    expect(prisma.loan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: 'L003', direction: 'BORROW' }) })
    );
    expect(reply.status).toHaveBeenCalledWith(201);
  });

  it('generates D### code for LEND loans', async () => {
    (prisma.account.findUnique as any).mockResolvedValue({ id: ACC_ID, type: 'BANK', userId: 'user-1', organizationId: 'org-1' });
    (prisma.loan.count as any).mockResolvedValue(0);
    (prisma.asset.findUnique as any).mockResolvedValue({ id: ASSET_ID });
    (prisma.loan.create as any).mockResolvedValue({ id: LOAN_ID, code: 'D001' });
    (prisma.transactionCategory.findFirst as any).mockResolvedValue({ ...mockCat, type: { id: 'type-1', behavior: 'LEND_OUT' } });
    (prisma.transaction.create as any).mockResolvedValue({});
    (prisma.asset.upsert as any).mockResolvedValue({});

    const reply = makeReply();
    await createLoanHandler(
      makeReq({ body: { ...baseBody, direction: 'LEND', borrowerName: 'มด' } }) as any,
      reply as any
    );

    expect(prisma.loan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: 'D001', direction: 'LEND', borrowerName: 'มด' }) })
    );
  });

  it('returns 404 when account not found', async () => {
    (prisma.account.findUnique as any).mockResolvedValue(null);

    const reply = makeReply();
    await createLoanHandler(makeReq({ body: baseBody }) as any, reply as any);

    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when account belongs to different org', async () => {
    (prisma.account.findUnique as any).mockResolvedValue({ id: ACC_ID, type: 'BANK', organizationId: OTHER_ORG });

    const reply = makeReply();
    await createLoanHandler(makeReq({ body: baseBody }) as any, reply as any);

    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on Zod validation error (missing name)', async () => {
    const reply = makeReply();
    await createLoanHandler(makeReq({ body: { accountId: 'acc-1', initialAmount: 1000 } }) as any, reply as any);

    expect(reply.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// addLoanTransactionHandler
// ---------------------------------------------------------------------------
describe('addLoanTransactionHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  const setupLoan = (direction: 'BORROW' | 'LEND') => ({
    id: LOAN_ID, direction, accountId: ACC_ID, organizationId: 'org-1',
    assetId: ASSET_ID, liabilityId: null,
  });

  const setupMocks = () => {
    (prisma.transactionCategory.findFirst as any).mockResolvedValue(mockCat);
    (prisma.transaction.create as any).mockResolvedValue({});
    (prisma.account.findUnique as any).mockResolvedValue({ id: ACC_ID, type: 'BANK', organizationId: 'org-1' });
    (prisma.asset.upsert as any).mockResolvedValue({});
  };

  it('BORROW loan + REPAY → asset DECREASE', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue(setupLoan('BORROW'));
    setupMocks();

    await addLoanTransactionHandler(
      makeReq({ params: { id: 'loan-1' }, body: { type: 'REPAY', amount: 5000 } }) as any,
      makeReply() as any
    );

    expect(prisma.asset.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ amount: { increment: -5000 } }) })
    );
  });

  it('LEND loan + REPAY → asset INCREASE (รับเงินคืน)', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue(setupLoan('LEND'));
    setupMocks();

    await addLoanTransactionHandler(
      makeReq({ params: { id: 'loan-1' }, body: { type: 'REPAY', amount: 10000 } }) as any,
      makeReply() as any
    );

    expect(prisma.asset.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ amount: { increment: 10000 } }) })
    );
  });

  it('LEND loan + BORROW (ให้ยืมเพิ่ม) → asset DECREASE', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue(setupLoan('LEND'));
    setupMocks();

    await addLoanTransactionHandler(
      makeReq({ params: { id: 'loan-1' }, body: { type: 'BORROW', amount: 3000 } }) as any,
      makeReply() as any
    );

    expect(prisma.asset.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ amount: { increment: -3000 } }) })
    );
  });

  it('returns 404 when loan not found', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue(null);

    const reply = makeReply();
    await addLoanTransactionHandler(
      makeReq({ params: { id: 'not-exist' }, body: { type: 'REPAY', amount: 1000 } }) as any,
      reply as any
    );

    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when loan belongs to different org', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue({ id: 'loan-1', direction: 'BORROW', organizationId: 'other-org' });

    const reply = makeReply();
    await addLoanTransactionHandler(
      makeReq({ params: { id: 'loan-1' }, body: { type: 'REPAY', amount: 1000 } }) as any,
      reply as any
    );

    expect(reply.status).toHaveBeenCalledWith(404);
  });
});

// ---------------------------------------------------------------------------
// updateLoanHandler
// ---------------------------------------------------------------------------
describe('updateLoanHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates name and borrowerName', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue({ id: 'loan-1', organizationId: 'org-1', accountId: 'acc-1', assetId: 'asset-1', liabilityId: null });
    (prisma.loan.update as any).mockResolvedValue({ id: 'loan-1', name: 'ใหม่', borrowerName: 'สมชาย' });

    const reply = makeReply();
    await updateLoanHandler(
      makeReq({ params: { id: 'loan-1' }, body: { name: 'ใหม่', borrowerName: 'สมชาย' } }) as any,
      reply as any
    );

    expect(prisma.loan.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'ใหม่', borrowerName: 'สมชาย' }) })
    );
    expect(reply.send).toHaveBeenCalled();
  });

  it('returns 404 when loan not found', async () => {
    (prisma.loan.findUnique as any).mockResolvedValue(null);

    const reply = makeReply();
    await updateLoanHandler(
      makeReq({ params: { id: 'no-loan' }, body: { name: 'x' } }) as any,
      reply as any
    );

    expect(reply.status).toHaveBeenCalledWith(404);
  });
});
