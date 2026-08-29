import { prisma } from '../lib/prisma';
import { BEHAVIOR_METADATA, SYSTEM_CATEGORY_KEYS } from '../constants/transactionConfig.js';

const TYPE_NAME = 'ปรับยอดเปิดบัญชี';
const CATEGORY_NAME = 'ปรับยอดเปิดบัญชี';

async function main() {
  console.log('▶ NEX-FEAT-12 Backfill: BALANCE_ADJUSTMENT type + category for existing organizations');

  const meta = BEHAVIOR_METADATA['BALANCE_ADJUSTMENT'];
  const organizations = await prisma.organization.findMany({ select: { id: true } });
  console.log(`  Found ${organizations.length} organizations`);

  for (const org of organizations) {
    const type = await prisma.transactionType.upsert({
      where: { organizationId_name: { organizationId: org.id, name: TYPE_NAME } },
      update: {
        behavior: 'BALANCE_ADJUSTMENT',
        defaultDirection: meta.defaultDirection,
        isExpenseLike: meta.isExpenseLike,
        cashflowBucket: meta.cashflowBucket,
        assetMultiplier: meta.assetMultiplier,
        liabMultiplier: meta.liabMultiplier,
      },
      create: {
        name: TYPE_NAME,
        behavior: 'BALANCE_ADJUSTMENT',
        organizationId: org.id,
        defaultDirection: meta.defaultDirection,
        isExpenseLike: meta.isExpenseLike,
        cashflowBucket: meta.cashflowBucket,
        assetMultiplier: meta.assetMultiplier,
        liabMultiplier: meta.liabMultiplier,
      },
    });

    const existingCategory = await prisma.transactionCategory.findFirst({
      where: { organizationId: org.id, systemKey: SYSTEM_CATEGORY_KEYS.BALANCE_ADJUSTMENT_SYS },
    });

    if (!existingCategory) {
      await prisma.transactionCategory.upsert({
        where: { organizationId_name_typeId: { organizationId: org.id, name: CATEGORY_NAME, typeId: type.id } },
        update: { systemKey: SYSTEM_CATEGORY_KEYS.BALANCE_ADJUSTMENT_SYS },
        create: {
          name: CATEGORY_NAME,
          organizationId: org.id,
          typeId: type.id,
          systemKey: SYSTEM_CATEGORY_KEYS.BALANCE_ADJUSTMENT_SYS,
          isActive: true,
        },
      });
    }

    console.log(`  ✅ org ${org.id}: type + category ready`);
  }

  console.log('✅ NEX-FEAT-12 backfill complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
