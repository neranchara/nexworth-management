/**
 * NEX-FEAT-13 Backfill: Split ออม/ลงทุน → ออม (SAVING) + ลงทุน (INVESTMENT)
 * Covers both org-scoped and global (organizationId = null) types/categories.
 *
 * Usage:
 *   npx tsx apps/api/src/scripts/backfill-saving-investment-split.ts
 */

import { prisma } from '../lib/prisma.js';
import { BEHAVIOR_METADATA } from '../constants/transactionConfig.js';
import {
  TYPE_NAME_SAVING,
  TYPE_NAME_INVESTMENT,
  TYPE_NAME_LEGACY_COMBO,
  TYPE_NAME_GOAL_SAVING,
  TYPE_NAME_EXPENSE,
  targetTypeNameForCategory,
} from '../constants/savingInvestmentSplit.js';

type BehaviorKey = keyof typeof BEHAVIOR_METADATA;

async function upsertType(orgId: string | null, name: string, behavior: BehaviorKey) {
  const meta = BEHAVIOR_METADATA[behavior];
  const existing = await prisma.transactionType.findFirst({
    where: { organizationId: orgId, name },
  });
  if (existing) {
    return prisma.transactionType.update({
      where: { id: existing.id },
      data: {
        behavior: behavior as any,
        defaultDirection: meta.defaultDirection,
        isExpenseLike: meta.isExpenseLike,
        cashflowBucket: meta.cashflowBucket,
        assetMultiplier: meta.assetMultiplier,
        liabMultiplier: meta.liabMultiplier,
        isActive: true,
      },
    });
  }
  return prisma.transactionType.create({
    data: {
      name,
      behavior: behavior as any,
      organizationId: orgId,
      defaultDirection: meta.defaultDirection,
      isExpenseLike: meta.isExpenseLike,
      cashflowBucket: meta.cashflowBucket,
      assetMultiplier: meta.assetMultiplier,
      liabMultiplier: meta.liabMultiplier,
      isActive: true,
    },
  });
}

async function moveCategoryToType(
  orgId: string | null,
  source: { id: string; name: string; typeId: string },
  toTypeId: string
) {
  if (source.typeId === toTypeId) {
    const synced = await prisma.transaction.updateMany({
      where: { categoryId: source.id, NOT: { typeId: toTypeId } },
      data: { typeId: toTypeId },
    });
    return { moved: false, txs: synced.count };
  }

  let target = await prisma.transactionCategory.findFirst({
    where: { organizationId: orgId, name: source.name, typeId: toTypeId },
  });

  if (!target) {
    try {
      await prisma.transactionCategory.update({
        where: { id: source.id },
        data: { typeId: toTypeId, isActive: true },
      });
      const txs = await prisma.transaction.updateMany({
        where: { categoryId: source.id },
        data: { typeId: toTypeId },
      });
      return { moved: true, txs: txs.count };
    } catch {
      target = await prisma.transactionCategory.findFirst({
        where: { organizationId: orgId, name: source.name, typeId: toTypeId },
      });
      if (!target) throw new Error(`Failed to move category ${source.name}`);
    }
  }

  const txs = await prisma.transaction.updateMany({
    where: { categoryId: source.id },
    data: { categoryId: target.id, typeId: toTypeId },
  });
  await prisma.transactionCategory.update({
    where: { id: source.id },
    data: { isActive: false },
  });
  await prisma.transaction.updateMany({
    where: { categoryId: target.id },
    data: { typeId: toTypeId },
  });
  return { moved: true, txs: txs.count };
}

async function migrateScope(orgId: string | null, label: string) {
  const savingType = await upsertType(orgId, TYPE_NAME_SAVING, 'SAVING');
  const investType = await upsertType(orgId, TYPE_NAME_INVESTMENT, 'INVESTMENT');
  const goalSavingType = await upsertType(orgId, TYPE_NAME_GOAL_SAVING, 'GOAL_SAVING');
  const expenseType = await upsertType(orgId, TYPE_NAME_EXPENSE, 'EXPENSE');

  const typeByName: Record<string, string> = {
    [TYPE_NAME_SAVING]: savingType.id,
    [TYPE_NAME_INVESTMENT]: investType.id,
    [TYPE_NAME_GOAL_SAVING]: goalSavingType.id,
    [TYPE_NAME_EXPENSE]: expenseType.id,
  };

  const categories = await prisma.transactionCategory.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, typeId: true, isActive: true },
  });

  let movedCats = 0;
  let updatedTxs = 0;

  for (const cat of categories) {
    const targetName = targetTypeNameForCategory(cat.name);
    if (!targetName) continue;
    const toTypeId = typeByName[targetName];
    if (!toTypeId) continue;

    if (cat.typeId === toTypeId && cat.isActive) {
      const synced = await prisma.transaction.updateMany({
        where: { categoryId: cat.id, NOT: { typeId: toTypeId } },
        data: { typeId: toTypeId },
      });
      updatedTxs += synced.count;
      continue;
    }

    const result = await moveCategoryToType(orgId, cat, toTypeId);
    if (result.moved) movedCats += 1;
    updatedTxs += result.txs;
  }

  // Deactivate ALL legacy combo types in this scope (null org may have many duplicates)
  const legacyTypes = await prisma.transactionType.findMany({
    where: { organizationId: orgId, name: TYPE_NAME_LEGACY_COMBO },
  });

  for (const legacy of legacyTypes) {
    const legacyCats = await prisma.transactionCategory.findMany({
      where: { typeId: legacy.id },
    });
    for (const cat of legacyCats) {
      const targetName = targetTypeNameForCategory(cat.name);
      if (targetName && typeByName[targetName]) {
        const result = await moveCategoryToType(orgId ?? cat.organizationId, cat, typeByName[targetName]);
        if (result.moved) movedCats += 1;
        updatedTxs += result.txs;
      } else if (cat.isActive) {
        // Unmapped custom leftover under legacy — keep type active flag handled below
      }
    }

    const leftoverActive = await prisma.transactionCategory.count({
      where: { typeId: legacy.id, isActive: true },
    });
    await prisma.transactionType.update({
      where: { id: legacy.id },
      data: { isActive: leftoverActive > 0 },
    });

    const orphanTxs = await prisma.transaction.findMany({
      where: { typeId: legacy.id },
      select: { id: true, category: { select: { typeId: true } } },
    });
    for (const tx of orphanTxs) {
      if (tx.category?.typeId && tx.category.typeId !== legacy.id) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { typeId: tx.category.typeId },
        });
        updatedTxs += 1;
      }
    }
  }

  console.log(`  ✅ ${label}: movedCats=${movedCats}, txsTypeSynced=${updatedTxs}`);
  return { movedCats, updatedTxs };
}

async function main() {
  console.log('▶ NEX-FEAT-13 Backfill: ออม/ลงทุน → ออม + ลงทุน');

  // 1) Global / null-org scope first (seed-master leftovers)
  await migrateScope(null, 'global (organizationId=null)');

  // 2) Each organization
  const organizations = await prisma.organization.findMany({ select: { id: true, name: true } });
  console.log(`  Found ${organizations.length} organizations`);
  for (const org of organizations) {
    await migrateScope(org.id, `org ${org.name || org.id}`);
  }

  console.log('✅ NEX-FEAT-13 backfill complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
