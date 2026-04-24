import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  console.log('--- FINDING PROVIDENT FUND TRANSACTIONS ---');
  
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { description: { contains: 'กองทุนสำรองเลี้ยงชีพ' } },
        { note: { contains: 'กองทุนสำรองเลี้ยงชีพ' } },
        { description: { contains: 'PVD' } }
      ]
    },
    include: { type: true, account: true }
  });
  
  console.log(`Found ${txs.length} transactions.`);
  let total = 0;
  txs.forEach(t => {
    // If it's an expense/transfer OUT of some account, it's actually an INCREASE for the PVD asset
    // In this DB, PVD is tracked as an account.
    console.log(`- [${t.date.toISOString().split('T')[0]}] ${t.amount} | ${t.description} | From: ${t.account.name}`);
    total += t.amount;
  });
  
  console.log('---------------------------');
  console.log('TOTAL CALCULATED PVD:', total);
  
  await prisma.$disconnect();
}

main();
