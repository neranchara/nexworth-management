import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  createFinancialRecordHandler, 
  listFinancialRecordsHandler,
  updateFinancialRecordHandler 
} from '../controllers/financial-record.controller';
import { prisma } from '../lib/prisma';

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
    }
  },
}));

const VALID_ACC_ID = '648e8940-02e0-474c-8515-373305a4156c';

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

    (prisma.asset.upsert as any).mockResolvedValue({
      accountId: VALID_ACC_ID,
      amount: 5000,
      note: 'My special investment note',
      updatedAt: new Date(),
      account: { name: 'Test Account', bank: null }
    });

    await createFinancialRecordHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    const sentData = mockReply.send.mock.calls[0][0];
    expect(sentData.record.note).toBe('My special investment note');
    
    // Verify that note was passed to Prisma upsert
    const upsertArgs = (prisma.asset.upsert as any).mock.calls[0][0];
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

    (prisma.asset.update as any).mockResolvedValue({
      accountId: VALID_ACC_ID,
      amount: 6000,
      note: 'Updated note',
      updatedAt: new Date(),
      account: { name: 'Test Account', bank: null }
    });

    await updateFinancialRecordHandler(mockRequest, mockReply);

    const sentData = mockReply.send.mock.calls[0][0];
    expect(sentData.record.note).toBe('Updated note');
    
    const updateArgs = (prisma.asset.update as any).mock.calls[0][0];
    expect(updateArgs.data.note).toBe('Updated note');
  });
});
