import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createFinancialRecordHandler,
  listFinancialRecordsHandler,
  updateFinancialRecordHandler
} from '../controllers/financial-record.controller';
import { prisma } from '../lib/prisma';
import { getSystemCategory } from '../controllers/transaction.controller';

// NEX-FEAT-12: create/update now go through prisma.$transaction + adjustAccountBalance/
// getSystemCategory (transaction.controller.ts) instead of prisma.asset.upsert/update directly.
vi.mock('../controllers/transaction.controller', () => ({
  adjustAccountBalance: vi.fn(),
  getSystemCategory: vi.fn(),
}));

// Mock the prisma library
vi.mock('../lib/prisma', () => ({
  prisma: {
    asset: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    liability: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    account: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    financialRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const VALID_ACC_ID = '648e8940-02e0-474c-8515-373305a4156c';

// Builds a mock `tx` client (used inside prisma.$transaction) and wires findUnique/upsert
// on it to return the given asset shape — CASE 1/3 below only assert on the final response
// and on what gets passed to tx.asset.upsert, mirroring what they used to assert on
// prisma.asset.upsert before NEX-FEAT-12 routed edits through the ledger.
const wireTransaction = (assetShape: { accountId: string; amount: number; note: string | null; account: any }) => {
  const tx = {
    asset: {
      // 1st call: "current" lookup before computing the delta (no existing record → 0).
      // Later calls (linked-id fetch, final response fetch): return the resulting shape.
      findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValue(assetShape),
      upsert: vi.fn().mockResolvedValue(assetShape),
    },
    liability: {
      findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValue(assetShape),
      upsert: vi.fn().mockResolvedValue(assetShape),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
    },
  };
  (prisma.$transaction as any).mockImplementation((cb: any) => cb(tx));
  (getSystemCategory as any).mockResolvedValue({ id: 'cat-adj', typeId: 'type-adj' });
  return tx;
};

describe('Asset Note Persistence Logic', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      log: { error: vi.fn() },
      user: { sub: 'user-123', organizationId: 'org-456' },
      body: {},
      query: {},
      params: {}
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('CASE 1: Should save note when creating/updating an Asset record', async () => {
    mockRequest.body = {
      accountId: VALID_ACC_ID,
      amount: 5000,
      type: 'ASSET',
      note: 'My special investment note'
    };

    const tx = wireTransaction({
      accountId: VALID_ACC_ID,
      amount: 5000,
      note: 'My special investment note',
      account: { name: 'Test Account', bank: null }
    });

    await createFinancialRecordHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    const sentData = mockReply.send.mock.calls[0][0];
    expect(sentData.record.note).toBe('My special investment note');

    // Verify that note was passed through to the note-upsert on the tx client
    const upsertArgs = (tx.asset.upsert as any).mock.calls[0][0];
    expect(upsertArgs.create.note).toBe('My special investment note');
    expect(upsertArgs.update.note).toBe('My special investment note');
  });

  it('CASE 2: Should retrieve note from database in listFinancialRecordsHandler', async () => {
    mockRequest.query = { type: 'ASSET' };

    (prisma.asset.findMany as any).mockResolvedValue([
      {
        accountId: VALID_ACC_ID,
        amount: 5000,
        note: 'Saved Note 123',
        updatedAt: new Date(),
        account: { name: 'Test Account', bank: null }
      }
    ]);

    await listFinancialRecordsHandler(mockRequest, mockReply);

    const sentData = mockReply.send.mock.calls[0][0];
    expect(sentData.records[0].note).toBe('Saved Note 123');
  });

  it('CASE 3: Should update note specifically when using updateFinancialRecordHandler', async () => {
    mockRequest.params = { id: `acc-${VALID_ACC_ID}` };
    mockRequest.body = {
      amount: 6000,
      type: 'ASSET',
      note: 'Updated note'
    };

    const tx = wireTransaction({
      accountId: VALID_ACC_ID,
      amount: 6000,
      note: 'Updated note',
      account: { name: 'Test Account', bank: null }
    });

    await updateFinancialRecordHandler(mockRequest, mockReply);

    const sentData = mockReply.send.mock.calls[0][0];
    expect(sentData.record.note).toBe('Updated note');

    const upsertArgs = (tx.asset.upsert as any).mock.calls[0][0];
    expect(upsertArgs.update.note).toBe('Updated note');
  });
});
