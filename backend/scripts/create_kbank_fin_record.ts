import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();

  // Find กสิกร (เงินเดือน)
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'กสิกร (เงินเดือน)' } },
    include: { asset: true }
  });

  if (!acc) {
    console.log('Account not found');
    return;
  }

  const balance = acc.asset?.amount ?? 8368.97;
  console.log(`Found: ${acc.name}, Balance: ${balance}, Type: ${acc.type}`);

  // Check if FinancialRecord already exists for this account
  const existing = await prisma.financialRecord.findFirst({
    where: { accountId: acc.id, type: 'ASSET' }
  });

  if (existing) {
    console.log('FinancialRecord already exists, updating amount...');
    await prisma.financialRecord.update({
      where: { id: existing.id },
      data: { amount: balance }
    });
  } else {
    await prisma.financialRecord.create({
      data: {
        organizationId: acc.organizationId,
        userId: acc.userId,
        accountId: acc.id,
        type: 'ASSET',
        amount: balance,
        date: new Date(),
        note: 'บัญชีเงินเดือน (แสดงในระบบ ไม่นับรวมยอด)'
      }
    });
    console.log(`✅ Created FinancialRecord for กสิกร (เงินเดือน): ${balance} บาท`);
  }

  await prisma.$disconnect();
}

main();
