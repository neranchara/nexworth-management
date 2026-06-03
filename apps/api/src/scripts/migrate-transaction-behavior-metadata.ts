import { prisma } from '../lib/prisma';
import { BEHAVIOR_METADATA, SYSTEM_CATEGORY_KEYS } from '../constants/transactionConfig.js';

async function main() {
  console.log('▶ P6 Migration: backfill TransactionType metadata + TransactionCategory systemKey');

  // 1. Backfill TransactionType metadata for all existing records
  const types = await prisma.transactionType.findMany({
    where: { OR: [{ defaultDirection: null }, { cashflowBucket: null }] }
  });

  console.log(`  Found ${types.length} TransactionType records missing metadata`);

  for (const t of types) {
    const meta = BEHAVIOR_METADATA[t.behavior];
    if (!meta) continue;
    await prisma.transactionType.update({
      where: { id: t.id },
      data: {
        defaultDirection: t.defaultDirection ?? meta.defaultDirection,
        isExpenseLike:    t.isExpenseLike    ?? meta.isExpenseLike,
        cashflowBucket:   t.cashflowBucket   ?? meta.cashflowBucket,
      }
    });
  }
  console.log('  ✅ TransactionType metadata backfilled');

  // 2. Backfill systemKey for system categories (lookup by behavior + name pattern)
  const systemCategoryRules = [
    { behavior: 'INTERNAL_TRANSFER', nameIncludes: 'เข้า', systemKey: SYSTEM_CATEGORY_KEYS.TRANSFER_IN },
    { behavior: 'INTERNAL_TRANSFER', nameIncludes: 'ออก', systemKey: SYSTEM_CATEGORY_KEYS.TRANSFER_OUT },
    { behavior: 'LOAN_BORROW',       nameIncludes: 'ยืม',  systemKey: SYSTEM_CATEGORY_KEYS.LOAN_BORROW_SYS },
    { behavior: 'LOAN_REPAY',        nameIncludes: 'คืน',  systemKey: SYSTEM_CATEGORY_KEYS.LOAN_REPAY_SYS },
  ];

  for (const rule of systemCategoryRules) {
    const cats = await prisma.transactionCategory.findMany({
      where: {
        systemKey: null,
        name: { contains: rule.nameIncludes },
        type: { behavior: rule.behavior as any }
      }
    });
    console.log(`  Found ${cats.length} categories for systemKey=${rule.systemKey}`);
    for (const cat of cats) {
      await prisma.transactionCategory.update({
        where: { id: cat.id },
        data: { systemKey: rule.systemKey }
      });
    }
  }
  console.log('  ✅ TransactionCategory systemKey backfilled');

  console.log('✅ P6 Migration complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
