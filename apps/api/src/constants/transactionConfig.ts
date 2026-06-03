// System keys for auto-created internal categories
export const SYSTEM_CATEGORY_KEYS = {
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  LOAN_BORROW_SYS: 'LOAN_BORROW_SYS',
  LOAN_REPAY_SYS: 'LOAN_REPAY_SYS',
} as const;

export type SystemCategoryKey = typeof SYSTEM_CATEGORY_KEYS[keyof typeof SYSTEM_CATEGORY_KEYS];

// Fallback metadata for existing orgs without DB metadata (dual-path safety net)
// Keyed by TransactionBehavior enum value
export const BEHAVIOR_METADATA: Record<string, {
  defaultDirection: 'INBOUND' | 'OUTBOUND' | 'NEUTRAL';
  isExpenseLike: boolean;
  cashflowBucket: string | null;
  assetMultiplier: 1 | -1 | 0;
  liabMultiplier: 1 | -1 | 0;
}> = {
  INCOME:            { defaultDirection: 'INBOUND',  isExpenseLike: false, cashflowBucket: 'income',  assetMultiplier:  1, liabMultiplier: -1 },
  EXPENSE:           { defaultDirection: 'OUTBOUND', isExpenseLike: true,  cashflowBucket: 'expense', assetMultiplier: -1, liabMultiplier:  1 },
  SAVING:            { defaultDirection: 'OUTBOUND', isExpenseLike: false, cashflowBucket: 'saving',  assetMultiplier:  1, liabMultiplier: -1 },
  INVESTMENT:        { defaultDirection: 'OUTBOUND', isExpenseLike: false, cashflowBucket: 'invest',  assetMultiplier:  1, liabMultiplier: -1 },
  GOAL_SAVING:       { defaultDirection: 'OUTBOUND', isExpenseLike: false, cashflowBucket: 'saving',  assetMultiplier:  1, liabMultiplier:  0 },
  INTERNAL_TRANSFER: { defaultDirection: 'NEUTRAL',  isExpenseLike: false, cashflowBucket: null,      assetMultiplier:  1, liabMultiplier: -1 },
  DEBT:              { defaultDirection: 'OUTBOUND', isExpenseLike: true,  cashflowBucket: 'debt',    assetMultiplier: -1, liabMultiplier:  1 },
  LOAN_BORROW:       { defaultDirection: 'INBOUND',  isExpenseLike: false, cashflowBucket: 'loan',    assetMultiplier:  1, liabMultiplier:  1 },
  LOAN_REPAY:        { defaultDirection: 'OUTBOUND', isExpenseLike: false, cashflowBucket: 'loan',    assetMultiplier: -1, liabMultiplier: -1 },
  GOAL:              { defaultDirection: 'NEUTRAL',  isExpenseLike: false, cashflowBucket: null,      assetMultiplier:  1, liabMultiplier:  0 },
  EMERGENCY:         { defaultDirection: 'OUTBOUND', isExpenseLike: false, cashflowBucket: 'saving',  assetMultiplier:  1, liabMultiplier:  0 },
};

// Helper: get direction from type DB field with fallback to BEHAVIOR_METADATA
export function getDirection(behavior: string, dbDirection?: string | null): 'INBOUND' | 'OUTBOUND' | 'NEUTRAL' {
  if (dbDirection) return dbDirection as 'INBOUND' | 'OUTBOUND' | 'NEUTRAL';
  return BEHAVIOR_METADATA[behavior]?.defaultDirection ?? 'NEUTRAL';
}

// Helper: get cashflow bucket from type DB field with fallback
export function getCashflowBucket(behavior: string, dbBucket?: string | null): string | null {
  if (dbBucket !== undefined && dbBucket !== null) return dbBucket;
  return BEHAVIOR_METADATA[behavior]?.cashflowBucket ?? null;
}

// Helper: get asset multiplier from direction or fallback arrays
export function getAssetMultiplier(behavior: string, isLiability: boolean, direction?: string | null): 1 | -1 | 0 {
  if (direction === 'TO') return isLiability ? -1 : 1;
  if (direction === 'FROM') return isLiability ? 1 : -1;
  const meta = BEHAVIOR_METADATA[behavior];
  if (!meta) return 0;
  return isLiability ? meta.liabMultiplier : meta.assetMultiplier;
}
