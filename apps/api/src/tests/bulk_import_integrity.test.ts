import { vi, describe, it, expect, beforeEach } from 'vitest';
import { bulkCreateTransactionHandler } from '../controllers/transaction.controller';
import { prisma } from '../lib/prisma';

// Mock the prisma library
vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    transactionCategory: {
      findUnique: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    transactionType: {
      findUnique: vi.fn(),
    },
    asset: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    liability: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Real v4 UUIDs
const VALID_UUID_1 = '648e8940-02e0-474c-8515-373305a4156c';
const VALID_UUID_2 = '739a8385-4001-49b9-913a-96e068f9463f';
const CAT_UUID_1 = '5e2d832c-3162-4317-9159-86640822607e';
const CAT_UUID_2 = '99227568-1502-4011-893c-24706312489e';
const TYPE_UUID_1 = '11111111-2222-3333-4444-555555555555';

describe('Bulk Import Data Integrity & Atomicity', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      log: { error: vi.fn() },
      user: { sub: 'user-123', organizationId: 'org-456' },
      body: [],
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    
    // Default implementation for $transaction (execute the callback)
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return await callback(prisma);
    });

    // Setup standard mocks that are used across rows
    (prisma.account.findUnique as any).mockResolvedValue({
      id: VALID_UUID_1,
      organizationId: 'org-456',
      type: 'BANK',
      userId: 'user-123'
    });
    
    (prisma.transactionType.findUnique as any).mockResolvedValue({
      id: TYPE_UUID_1,
      behavior: 'EXPENSE'
    });
  });

  it('CASE 1: Should fail and rollback if date is in the year 46143 (Out of Safe Zone)', async () => {
    mockRequest.body = [
      {
        categoryId: CAT_UUID_1,
        accountId: VALID_UUID_1,
        amount: 100,
        date: '2024-05-08'
      },
      {
        categoryId: CAT_UUID_2,
        accountId: VALID_UUID_1,
        amount: 200,
        date: '46143-01-01' // OUT OF RANGE
      }
    ];

    // Both categories exist
    (prisma.transactionCategory.findUnique as any).mockResolvedValue({
      id: CAT_UUID_1,
      organizationId: 'org-456',
      typeId: TYPE_UUID_1
    });

    await bulkCreateTransactionHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Row 2: Date year 46143 is outside the allowed range')
    }));
    
    // Row 1 should have been created, but then everything rolled back
    // However, since validation for Row 2 happens before create call for Row 2 but after Row 1,
    //prisma.transaction.create should have been called ONCE for Row 1.
    expect(prisma.transaction.create).toHaveBeenCalledTimes(1);
  });

  it('CASE 2: Should rollback if Category ID is not found (Entity Integrity)', async () => {
    mockRequest.body = [
      {
        categoryId: CAT_UUID_1,
        accountId: VALID_UUID_1,
        amount: 100,
        date: '2024-05-08'
      },
      {
        categoryId: CAT_UUID_2,
        accountId: VALID_UUID_1,
        amount: 200,
        date: '2024-05-08'
      }
    ];

    // First item category is valid
    (prisma.transactionCategory.findUnique as any).mockResolvedValueOnce({
      id: CAT_UUID_1,
      organizationId: 'org-456',
      typeId: TYPE_UUID_1
    });
    // Second item category is missing
    (prisma.transactionCategory.findUnique as any).mockResolvedValueOnce(null);

    await bulkCreateTransactionHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: `Row 2: Category ID ${CAT_UUID_2} not found`
    }));
  });

  it('CASE 3: Should import successfully when all data is valid', async () => {
    mockRequest.body = [
      {
        categoryId: CAT_UUID_1,
        accountId: VALID_UUID_1,
        amount: 500,
        date: '2024-05-08'
      }
    ];

    (prisma.transactionCategory.findUnique as any).mockResolvedValue({
      id: CAT_UUID_1,
      organizationId: 'org-456',
      typeId: TYPE_UUID_1
    });

    (prisma.transaction.create as any).mockResolvedValue({ id: 'tx-1' });

    await bulkCreateTransactionHandler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: '1 transactions imported successfully'
    }));
    
    // Verify balance adjustment call (Asset upsert for BANK account)
    expect(prisma.asset.upsert).toHaveBeenCalled();
  });
});
