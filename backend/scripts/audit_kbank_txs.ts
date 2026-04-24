import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'กสิกร โอนภายใน' } }
  });
  
  if (!acc) {
    console.log('Account not found');
    return;
  }

  console.log('--- TRANSACTION AUDIT: กสิกร โอนภายใน ---');
  
  const txs = await prisma.transaction.findMany({
    where: { accountId: acc.id },
    include: { type: true, category: true },
    orderBy: { date: 'desc' }
  });
  
  txs.forEach(t => {
    const isIncrease = ['INCOME', 'SAVING', 'GOAL_SAVING', 'LOAN_BORROW'].includes(t.type.behavior);
    const sign = isIncrease ? '+' : '-';
    console.log(`- [${t.date.toISOString().split('T')[0]}] ${sign}${t.amount.toFixed(2)} | ${t.type.name} | ${t.description || 'No description'}`);
  });
  
  await prisma.$disconnect();
}

main();
