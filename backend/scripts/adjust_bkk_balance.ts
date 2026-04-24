import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();

  const REAL_BALANCE = 8368.97;

  // Find Bangkok Bank account (personal only)
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'กรุงเทพ' }, isPersonal: true },
    include: { asset: true }
  });

  if (!acc) { console.log('Account not found'); return; }

  const neonBalance = acc.asset?.amount ?? 0;
  const diff = neonBalance - REAL_BALANCE;

  console.log(`กรุงเทพ: Neon=${neonBalance.toFixed(2)}, Real=${REAL_BALANCE}, Diff=${diff.toFixed(2)}`);

  if (Math.abs(diff) < 0.01) { console.log('Already balanced.'); return; }

  // Get all expense types for this org
  const expenseTypes = await prisma.transactionType.findMany({
    where: { behavior: 'EXPENSE' },
    include: { categories: true }
  });

  console.log('--- Expense Types ---');
  expenseTypes.forEach(t => {
    console.log(`  Type: ${t.name} (${t.id})`);
    t.categories.forEach(c => console.log(`    Cat: ${c.name} (${c.id})`));
  });

  // Pick first type that has at least one category
  const usableType = expenseTypes.find(t => t.categories.length > 0);
  const usableCat = usableType?.categories[0];

  if (!usableType || !usableCat) {
    console.log('No usable expense type/category found');
    return;
  }

  console.log(`\nUsing Type: ${usableType.name}, Category: ${usableCat.name}`);

  // Create adjustment transaction
  await prisma.transaction.create({
    data: {
      organizationId: acc.organizationId,
      userId: acc.userId,
      accountId: acc.id,
      typeId: usableType.id,
      categoryId: usableCat.id,
      amount: diff,
      date: new Date('2026-04-25'),
      actualDate: new Date('2026-04-25'),
      description: 'ปรับยอดบัญชี: ค่าใช้จ่ายยิบย่อย เม.ย. 2569'
    }
  });

  // Update asset balance
  await prisma.asset.update({
    where: { accountId: acc.id },
    data: { amount: REAL_BALANCE }
  });

  console.log(`\n✅ Created adjustment: -${diff.toFixed(2)} บาท`);
  console.log(`✅ Updated กรุงเทพ balance to: ${REAL_BALANCE} บาท`);

  await prisma.$disconnect();
}

main();
