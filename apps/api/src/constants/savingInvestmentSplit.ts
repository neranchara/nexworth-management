/**
 * NEX-FEAT-13 — Canonical split of ออม/ลงทุน into ออม (SAVING) + ลงทุน (INVESTMENT).
 * Used by org seed + backfill so mappings stay in sync.
 */

export const TYPE_NAME_SAVING = 'ออม';
export const TYPE_NAME_INVESTMENT = 'ลงทุน';
export const TYPE_NAME_LEGACY_COMBO = 'ออม/ลงทุน';
export const TYPE_NAME_GOAL_SAVING = 'เงินมีเป้าหมาย';
export const TYPE_NAME_EXPENSE = 'รายจ่าย';

/** Category names that belong under ออม (SAVING) */
export const SAVING_CATEGORY_NAMES = ['เงินออม', 'เงินฉุกเฉิน'] as const;

/** Category names that belong under ลงทุน (INVESTMENT) */
export const INVESTMENT_CATEGORY_NAMES = ['ลงทุนหุ้น', 'ลงทุนทอง', 'ลงทุนธุรกิจ'] as const;

/** Goal-park categories → เงินมีเป้าหมาย (GOAL_SAVING) */
export const GOAL_SAVING_CATEGORY_NAMES = ['ท่องเที่ยว', 'เงินซื้อรถ'] as const;

/**
 * Mis-seeded as ออม/ลงทุน historically but are consumption → รายจ่าย.
 * (Does not change posted amounts; only type/behavior classification via category.typeId + tx.typeId.)
 */
export const EXPENSE_RECLASS_CATEGORY_NAMES = ['บริจาค', 'ค่าใช้จ่ายรถ'] as const;

/** Resolve which type name a legacy category should move to (null = leave alone) */
export function targetTypeNameForCategory(categoryName: string): string | null {
  if ((SAVING_CATEGORY_NAMES as readonly string[]).includes(categoryName)) return TYPE_NAME_SAVING;
  if ((INVESTMENT_CATEGORY_NAMES as readonly string[]).includes(categoryName)) return TYPE_NAME_INVESTMENT;
  if ((GOAL_SAVING_CATEGORY_NAMES as readonly string[]).includes(categoryName)) return TYPE_NAME_GOAL_SAVING;
  if ((EXPENSE_RECLASS_CATEGORY_NAMES as readonly string[]).includes(categoryName)) return TYPE_NAME_EXPENSE;
  return null;
}
