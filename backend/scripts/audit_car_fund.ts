import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'บัญชีเงินซื้อรถ' } },
    include: { asset: true }
  });
  
  if (!acc) {
    console.log('Account not found');
    return;
  }

  console.log('--- AUDIT: บัญชีเงินซื้อรถ ---');
  console.log('Current DB Balance:', acc.asset?.amount);
  
  const txs = await prisma.transaction.findMany({
    where: { accountId: acc.id },
    include: { type: true },
    orderBy: { date: 'asc' }
  });
  
  let calculated = 0;
  txs.forEach(t => {
    // Determine sign based on behavior
    const multiplier = (t.type.behavior === 'INCOME' || t.type.behavior === 'SAVING' || t.type.behavior === 'GOAL_SAVING') ? 1 : -1;
    const signedAmount = t.amount * multiplier;
    console.log(`- [${t.date.toISOString().split('T')[0]}] ${signedAmount.toFixed(2)} | ${t.description} (${t.type.name})`);
    calculated += signedAmount;
  });
  
  console.log('---------------------------');
  console.log('Calculated Sum from Txs:', calculated);
  console.log('Target Balance:', 346032.08);
  console.log('Difference:', 346032.08 - calculated);
  
  await prisma.$disconnect();
}

main();
