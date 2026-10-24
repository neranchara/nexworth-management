import { describe, it, expect } from 'vitest';
import {
  targetTypeNameForCategory,
  TYPE_NAME_SAVING,
  TYPE_NAME_INVESTMENT,
  TYPE_NAME_GOAL_SAVING,
  TYPE_NAME_EXPENSE,
  SAVING_CATEGORY_NAMES,
  INVESTMENT_CATEGORY_NAMES,
  GOAL_SAVING_CATEGORY_NAMES,
  EXPENSE_RECLASS_CATEGORY_NAMES,
} from '../constants/savingInvestmentSplit.js';

describe('NEX-FEAT-13 saving/investment split mapping', () => {
  it('maps saving categories to ออม', () => {
    for (const name of SAVING_CATEGORY_NAMES) {
      expect(targetTypeNameForCategory(name)).toBe(TYPE_NAME_SAVING);
    }
  });

  it('maps investment categories to ลงทุน', () => {
    for (const name of INVESTMENT_CATEGORY_NAMES) {
      expect(targetTypeNameForCategory(name)).toBe(TYPE_NAME_INVESTMENT);
    }
  });

  it('maps goal-park categories to เงินมีเป้าหมาย', () => {
    for (const name of GOAL_SAVING_CATEGORY_NAMES) {
      expect(targetTypeNameForCategory(name)).toBe(TYPE_NAME_GOAL_SAVING);
    }
  });

  it('reclassifies mis-seeded consumption categories to รายจ่าย', () => {
    for (const name of EXPENSE_RECLASS_CATEGORY_NAMES) {
      expect(targetTypeNameForCategory(name)).toBe(TYPE_NAME_EXPENSE);
    }
  });

  it('returns null for unknown / unrelated category names', () => {
    expect(targetTypeNameForCategory('เงินเดือน')).toBeNull();
    expect(targetTypeNameForCategory('ชำระหนี้')).toBeNull();
    expect(targetTypeNameForCategory('Custom Category')).toBeNull();
  });
});
