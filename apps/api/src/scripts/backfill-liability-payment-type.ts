import { prisma } from '../lib/prisma';
import { BEHAVIOR_METADATA, SYSTEM_CATEGORY_KEYS } from '../constants/transactionConfig.js';

const TYPE_NAME = 'ชำระหนี้บัตรเครดิต';
const CATEGORY_NAME = 'ชำระบัตรเครดิต';

async function main() {
  console.log('▶ NEX-FEAT-09 Backfill: LIABILITY_PAYMENT type + category for existing organizations');

  const meta = BEHAVIOR_METADATA['LIABILITY_PAYMENT'];
  const organizations = await prisma.organization.findMany({ select: { id: true } });
  console.log(`  Found ${organizations.length} organizations`);

  for (const org of organizations) {
    const type = await prisma.transactionType.upsert({
      where: { organizationId_name: { organizationId: org.id, name: TYPE_NAME } },
      update: {
        behavior: 'LIABILITY_PAYMENT',
        defaultDirection: meta.defaultDirection,
        isExpenseLike: meta.isExpenseLike,
        cashflowBucket: meta.cashflowBucket,
      },
      create: {
        name: TYPE_NAME,
        behavior: 'LIABILITY_PAYMENT',
        organizationId: org.id,
        defaultDirection: meta.defaultDirection,
        isExpenseLike: meta.isExpenseLike,
        cashflowBucket: meta.cashflowBucket,
      },
    });

    const existingCategory = await prisma.transactionCategory.findFirst({
      where: { organizationId: org.id, systemKey: SYSTEM_CATEGORY_KEYS.LIABILITY_PAYMENT_SYS },
    });

    if (!existingCategory) {
      await prisma.transactionCategory.upsert({
        where: { organizationId_name_typeId: { organizationId: org.id, name: CATEGORY_NAME, typeId: type.id } },
        update: { systemKey: SYSTEM_CATEGORY_KEYS.LIABILITY_PAYMENT_SYS },
        create: {
          name: CATEGORY_NAME,
          organizationId: org.id,
          typeId: type.id,
          systemKey: SYSTEM_CATEGORY_KEYS.LIABILITY_PAYMENT_SYS,
          isActive: true,
        },
      });
    }

    console.log(`  ✅ org ${org.id}: type + category ready`);
  }

  console.log('✅ NEX-FEAT-09 backfill complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
