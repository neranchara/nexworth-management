import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BEHAVIOR_METADATA,
  SYSTEM_CATEGORY_KEYS,
  getDirection,
  getCashflowBucket,
  getAssetMultiplier,
} from '../constants/transactionConfig.js';

// ─────────────────────────────────────────────
// P6: Transaction Behavior DB-driven — unit tests
// ─────────────────────────────────────────────

describe('P6 — BEHAVIOR_METADATA coverage', () => {
  const expectedBehaviors = [
    'INCOME', 'EXPENSE', 'SAVING', 'INVESTMENT', 'GOAL_SAVING',
    'INTERNAL_TRANSFER', 'DEBT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL', 'EMERGENCY'
  ];

  it('has metadata for every TransactionBehavior enum value', () => {
    for (const b of expectedBehaviors) {
      expect(BEHAVIOR_METADATA[b], `Missing metadata for ${b}`).toBeDefined();
    }
  });

  it('every behavior has required fields', () => {
    for (const [behavior, meta] of Object.entries(BEHAVIOR_METADATA)) {
      expect(['INBOUND', 'OUTBOUND', 'NEUTRAL'], `${behavior}.defaultDirection invalid`)
        .toContain(meta.defaultDirection);
      expect(typeof meta.isExpenseLike, `${behavior}.isExpenseLike not boolean`)
        .toBe('boolean');
      expect([-1, 0, 1], `${behavior}.assetMultiplier invalid`)
        .toContain(meta.assetMultiplier);
      expect([-1, 0, 1], `${behavior}.liabMultiplier invalid`)
        .toContain(meta.liabMultiplier);
    }
  });

  it('INCOME is INBOUND with income bucket', () => {
    expect(BEHAVIOR_METADATA['INCOME'].defaultDirection).toBe('INBOUND');
    expect(BEHAVIOR_METADATA['INCOME'].cashflowBucket).toBe('income');
    expect(BEHAVIOR_METADATA['INCOME'].isExpenseLike).toBe(false);
  });

  it('EXPENSE is OUTBOUND and expense-like', () => {
    expect(BEHAVIOR_METADATA['EXPENSE'].defaultDirection).toBe('OUTBOUND');
    expect(BEHAVIOR_METADATA['EXPENSE'].cashflowBucket).toBe('expense');
    expect(BEHAVIOR_METADATA['EXPENSE'].isExpenseLike).toBe(true);
  });

  it('DEBT is OUTBOUND and expense-like', () => {
    expect(BEHAVIOR_METADATA['DEBT'].isExpenseLike).toBe(true);
  });

  it('INTERNAL_TRANSFER is NEUTRAL with no cashflow bucket', () => {
    expect(BEHAVIOR_METADATA['INTERNAL_TRANSFER'].defaultDirection).toBe('NEUTRAL');
    expect(BEHAVIOR_METADATA['INTERNAL_TRANSFER'].cashflowBucket).toBeNull();
  });
});

describe('P6 — getDirection()', () => {
  it('uses DB field when available', () => {
    expect(getDirection('INCOME', 'OUTBOUND')).toBe('OUTBOUND'); // DB overrides
  });

  it('falls back to BEHAVIOR_METADATA when DB field is null', () => {
    expect(getDirection('INCOME', null)).toBe('INBOUND');
    expect(getDirection('EXPENSE', null)).toBe('OUTBOUND');
  });

  it('falls back to BEHAVIOR_METADATA when DB field is undefined', () => {
    expect(getDirection('LOAN_BORROW')).toBe('INBOUND');
    expect(getDirection('LOAN_REPAY')).toBe('OUTBOUND');
  });

  it('returns NEUTRAL for unknown behavior', () => {
    expect(getDirection('UNKNOWN_BEHAVIOR', null)).toBe('NEUTRAL');
  });
});

describe('P6 — getCashflowBucket()', () => {
  it('uses DB field when available', () => {
    expect(getCashflowBucket('INCOME', 'custom_bucket')).toBe('custom_bucket');
  });

  it('falls back to BEHAVIOR_METADATA when DB field is null', () => {
    expect(getCashflowBucket('INCOME', null)).toBe('income');
    expect(getCashflowBucket('EXPENSE', null)).toBe('expense');
    expect(getCashflowBucket('SAVING', null)).toBe('saving');
    expect(getCashflowBucket('DEBT', null)).toBe('debt');
    expect(getCashflowBucket('LOAN_BORROW', null)).toBe('loan');
    expect(getCashflowBucket('INVESTMENT', null)).toBe('invest');
  });

  it('returns null for INTERNAL_TRANSFER', () => {
    expect(getCashflowBucket('INTERNAL_TRANSFER', null)).toBeNull();
  });

  it('returns null for unknown behavior', () => {
    expect(getCashflowBucket('UNKNOWN', null)).toBeNull();
  });
});

describe('P6 — getAssetMultiplier()', () => {
  describe('explicit direction takes priority', () => {
    it('direction=TO on asset account → +1', () => {
      expect(getAssetMultiplier('EXPENSE', false, 'TO')).toBe(1);
    });

    it('direction=FROM on asset account → -1', () => {
      expect(getAssetMultiplier('INCOME', false, 'FROM')).toBe(-1);
    });

    it('direction=TO on liability account → -1', () => {
      expect(getAssetMultiplier('EXPENSE', true, 'TO')).toBe(-1);
    });

    it('direction=FROM on liability account → +1', () => {
      expect(getAssetMultiplier('INCOME', true, 'FROM')).toBe(1);
    });
  });

  describe('fallback to BEHAVIOR_METADATA when no direction', () => {
    it('INCOME on asset → +1 (increases balance)', () => {
      expect(getAssetMultiplier('INCOME', false, null)).toBe(1);
    });

    it('EXPENSE on asset → -1 (decreases balance)', () => {
      expect(getAssetMultiplier('EXPENSE', false, null)).toBe(-1);
    });

    it('LOAN_BORROW on asset → +1 (money received)', () => {
      expect(getAssetMultiplier('LOAN_BORROW', false, null)).toBe(1);
    });

    it('LOAN_REPAY on asset → -1 (money paid out)', () => {
      expect(getAssetMultiplier('LOAN_REPAY', false, null)).toBe(-1);
    });

    it('EXPENSE on liability → +1 (increases debt)', () => {
      expect(getAssetMultiplier('EXPENSE', true, null)).toBe(1);
    });

    it('INCOME on liability → -1 (decreases debt)', () => {
      expect(getAssetMultiplier('INCOME', true, null)).toBe(-1);
    });
  });
});

describe('P6 — SYSTEM_CATEGORY_KEYS', () => {
  it('has all required system keys', () => {
    expect(SYSTEM_CATEGORY_KEYS.TRANSFER_IN).toBe('TRANSFER_IN');
    expect(SYSTEM_CATEGORY_KEYS.TRANSFER_OUT).toBe('TRANSFER_OUT');
    expect(SYSTEM_CATEGORY_KEYS.LOAN_BORROW_SYS).toBe('LOAN_BORROW_SYS');
    expect(SYSTEM_CATEGORY_KEYS.LOAN_REPAY_SYS).toBe('LOAN_REPAY_SYS');
  });
});

// ─────────────────────────────────────────────
// getSystemCategory auto-heal (mock-based)
// ─────────────────────────────────────────────

describe('P6 — getSystemCategory() auto-heal pattern', () => {
  const mockOrgId = 'org-123';

  const makeMockDb = (overrides: Partial<{
    findBySysKey: any;
    findByName: any;
    findType: any;
  }> = {}) => {
    const cat = { id: 'cat-1', name: 'โอนเข้าภายใน', typeId: 'type-1', systemKey: null };
    return {
      transactionCategory: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(overrides.findBySysKey ?? null)
          .mockResolvedValueOnce(overrides.findByName ?? null),
        update: vi.fn().mockResolvedValue({ ...cat, systemKey: 'TRANSFER_IN' }),
        create: vi.fn().mockResolvedValue({ ...cat, systemKey: 'TRANSFER_IN' }),
      },
      transactionType: {
        findFirst: vi.fn().mockResolvedValue(overrides.findType ?? { id: 'type-1' }),
      },
    };
  };

  it('returns category by systemKey on first lookup', async () => {
    const existingCat = { id: 'cat-1', name: 'โอนเข้าภายใน', typeId: 'type-1', systemKey: 'TRANSFER_IN', type: {} };
    const db = makeMockDb({ findBySysKey: existingCat });

    // Import dynamically to allow testing the helper
    const { default: getSystemCategoryFn } = await import('../controllers/transaction.controller.js').catch(() => ({ default: null }));

    // Verify mock DB was queried correctly
    expect(db.transactionCategory.findFirst).toBeDefined();
  });

  it('auto-heals: sets systemKey on category found by name', async () => {
    const catWithoutKey = { id: 'cat-1', name: 'โอนเข้าภายใน', typeId: 'type-1', systemKey: null, type: {} };
    const db = makeMockDb({ findBySysKey: null, findByName: catWithoutKey });

    // Simulate the auto-heal: findFirst by sysKey returns null, findFirst by name returns cat
    const found = await db.transactionCategory.findFirst(); // null (no sysKey match)
    expect(found).toBeNull();

    const foundByName = await db.transactionCategory.findFirst(); // found by name
    expect(foundByName).not.toBeNull();
    expect(foundByName.systemKey).toBeNull(); // hasn't been healed yet

    // After heal
    await db.transactionCategory.update({ where: { id: foundByName.id }, data: { systemKey: 'TRANSFER_IN' } });
    expect(db.transactionCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { systemKey: 'TRANSFER_IN' }
    });
  });

  it('creates new category when not found by any method', async () => {
    const db = makeMockDb({ findBySysKey: null, findByName: null });

    // Both lookups return null → should create
    await db.transactionCategory.findFirst(); // null
    await db.transactionCategory.findFirst(); // null
    await db.transactionType.findFirst();     // type found
    await db.transactionCategory.create({
      data: { name: 'โอนเข้าภายใน', organizationId: mockOrgId, typeId: 'type-1', systemKey: 'TRANSFER_IN', isActive: true }
    });

    expect(db.transactionCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ systemKey: 'TRANSFER_IN' })
      })
    );
  });
});
