import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const targetAccounts = [
    'กสิกร โอนภายใน',
    'ออมสิน สำรองครอบครัว',
    'ออมสิน เงินออมแม่',
    'ธนาคารอาคารสงเคราะห์',
    'ออมสิน บัญชีเงินซื้อรถ',
    'กรุงเทพ มด',
    'ไทยพาณิชย์'
  ];

  console.log('--- TRANSACTION AUDIT (NEON) ---');
  
  for (const accName of targetAccounts) {
    const account = await prisma.account.findFirst({
      where: { name: { contains: accName } },
      include: { asset: true }
    });
    
    if (!account) {
      console.log(`Account not found: ${accName}`);
      continue;
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      include: { type: true, category: true },
      orderBy: { date: 'desc' },
      take: 20 // Let's look at recent 20
    });

    console.log(`\n=== Account: ${account.name} (Current Balance: ${account.asset?.amount}) ===`);
    if (transactions.length === 0) {
      console.log('  No transactions found.');
    } else {
      transactions.forEach(t => {
        const sign = t.type.behavior === 'INCOME' || t.type.behavior === 'SAVING' || t.type.behavior === 'GOAL_SAVING' ? '+' : '-';
        console.log(`  [${t.date.toISOString().split('T')[0]}] ${sign}${t.amount.toFixed(2)} | ${t.type.name} | ${t.category.name} | ${t.description || 'No desc'}`);
      });
    }
  }

  await prisma.$disconnect();
}

main();
