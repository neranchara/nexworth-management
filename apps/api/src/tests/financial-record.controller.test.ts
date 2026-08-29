/**
 * Unit Tests: Financial Record Controller (NEX-BUG-12 / NEX-FEAT-12)
 *
 * NEX-BUG-12: Liability.amount is stored positive (amount owed), matching
 * transaction.controller.ts's convention.
 * NEX-FEAT-12: manual balance edits now post a real Transaction (via the same
 * adjustAccountBalance/getSystemCategory helpers transaction.controller.ts uses)
 * instead of upserting Liability.amount/Asset.amount directly.
 *
 * mock prisma + transaction.controller.ts helpers entirely — no real DB needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFinancialRecordHandler, updateFinancialRecordHandler } from '../controllers/financial-record.controller';

vi.mock('../controllers/transaction.controller', () => ({
  adjustAccountBalance: vi.fn(),
  getSystemCategory: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    account: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../lib/prisma';
import { adjustAccountBalance, getSystemCategory } from '../controllers/transaction.controller';

const makeReq = (overrides: Record<string, any> = {}) => ({
  user: { sub: 'user-1', organizationId: 'org-1' },
  query: {},
  params: {},
  body: {},
  log: { error: vi.fn() },
  ...overrides,
});

const makeReply = () => {
  const reply: any = {};
  reply.send = vi.fn().mockReturnValue(reply);
  reply.status = vi.fn().mockReturnValue(reply);
  return reply;
};

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const CATEGORY = { id: 'cat-adj', typeId: 'type-adj' };

// Builds a mock `tx` client and wires prisma.$transaction to invoke the callback with it.
const makeMockTx = (currentAmount: number | null) => {
  const tx = {
    liability: {
      findUnique: vi.fn().mockResolvedValue(
        currentAmount === null ? null : { accountId: ACCOUNT_ID, amount: currentAmount, note: null }
      ),
      upsert: vi.fn().mockResolvedValue({ accountId: ACCOUNT_ID, amount: 0, note: null, account: {} }),
    },
    asset: {
      findUnique: vi.fn().mockResolvedValue(
        currentAmount === null ? null : { accountId: ACCOUNT_ID, amount: currentAmount, note: null }
      ),
      upsert: vi.fn().mockResolvedValue({ accountId: ACCOUNT_ID, amount: 0, note: null, account: {} }),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
    },
  };
  (prisma.$transaction as any).mockImplementation((cb: any) => cb(tx));
  return tx;
};

describe('NEX-BUG-12 — Liability.amount sign convention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSystemCategory as any).mockResolvedValue(CATEGORY);
  });

  it('createFinancialRecordHandler posts a positive delta for LIABILITY (first save, currently 0)', async () => {
    makeMockTx(null);

    const req = makeReq({
      body: { accountId: ACCOUNT_ID, amount: 9059.42, type: 'LIABILITY', note: null },
    });
    await createFinancialRecordHandler(req as any, makeReply() as any);

    expect(adjustAccountBalance).toHaveBeenCalledWith(ACCOUNT_ID, 9059.42, CATEGORY.typeId, null, false, expect.anything());
  });

  it('a negative amount entered by the user is normalized to positive (Math.abs) before computing the delta', async () => {
    makeMockTx(null);

    const req = makeReq({
      body: { accountId: ACCOUNT_ID, amount: -7000, type: 'LIABILITY', note: null },
    });
    await createFinancialRecordHandler(req as any, makeReply() as any);

    expect(adjustAccountBalance).toHaveBeenCalledWith(ACCOUNT_ID, 7000, CATEGORY.typeId, null, false, expect.anything());
  });
});

describe('NEX-FEAT-12 — balance edits post a real Transaction via the ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSystemCategory as any).mockResolvedValue(CATEGORY);
  });

  it('posts the signed delta (target - current), not the raw target amount', async () => {
    const tx = makeMockTx(5000); // current liability = 5000

    const req = makeReq({
      body: { accountId: ACCOUNT_ID, amount: 8000, type: 'LIABILITY', note: null },
    });
    await createFinancialRecordHandler(req as any, makeReply() as any);

    expect(adjustAccountBalance).toHaveBeenCalledWith(ACCOUNT_ID, 3000, CATEGORY.typeId, null, false, expect.anything());
    expect(tx.transaction.create).toHaveBeenCalledOnce();
    const created = (tx.transaction.create as any).mock.calls[0][0].data;
    expect(created.amount).toBe(3000); // Math.abs(delta) — always stored positive
    expect(created.liabilityId ?? null).not.toBeUndefined();
  });

  it('a decrease (paying down) posts a negative delta but a positive stored amount', async () => {
    const tx = makeMockTx(8000);

    const req = makeReq({
      params: { id: `acc-${ACCOUNT_ID}` },
      body: { amount: 3000, type: 'LIABILITY', note: null },
    });
    await updateFinancialRecordHandler(req as any, makeReply() as any);

    expect(adjustAccountBalance).toHaveBeenCalledWith(ACCOUNT_ID, -5000, CATEGORY.typeId, null, false, expect.anything());
    const created = (tx.transaction.create as any).mock.calls[0][0].data;
    expect(created.amount).toBe(5000);
  });

  it('no-op edit (delta === 0) does not post a Transaction or call adjustAccountBalance', async () => {
    const tx = makeMockTx(5000);

    const req = makeReq({
      body: { accountId: ACCOUNT_ID, amount: 5000, type: 'LIABILITY', note: 'just updating the note' },
    });
    await createFinancialRecordHandler(req as any, makeReply() as any);

    expect(adjustAccountBalance).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.liability.upsert).toHaveBeenCalledOnce(); // note still gets saved
  });

  it('works the same way for ASSET accounts (isLiability=false)', async () => {
    const tx = makeMockTx(1000);

    const req = makeReq({
      body: { accountId: ACCOUNT_ID, amount: 1500, type: 'ASSET', note: null },
    });
    await createFinancialRecordHandler(req as any, makeReply() as any);

    expect(adjustAccountBalance).toHaveBeenCalledWith(ACCOUNT_ID, 500, CATEGORY.typeId, null, false, expect.anything());
    expect(tx.asset.findUnique).toHaveBeenCalled();
    expect(tx.liability.findUnique).not.toHaveBeenCalled();
  });

  it('response contract is unchanged: record.amount echoes the raw request amount', async () => {
    makeMockTx(5000);
    const reply = makeReply();

    const req = makeReq({
      body: { accountId: ACCOUNT_ID, amount: 8000, type: 'LIABILITY', note: null },
    });
    await createFinancialRecordHandler(req as any, reply as any);

    expect(reply.status).toHaveBeenCalledWith(201);
    const payload = (reply.send as any).mock.calls[0][0];
    expect(payload.record.amount).toBe(8000);
    expect(payload.record.accountId).toBe(ACCOUNT_ID);
    expect(payload.record.type).toBe('LIABILITY');
  });
});
