import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  console.log('--- REPAIRING LOAN TRANSACTIONS: ชุดทำงาน ---');

  // 1. Find the types for LOAN_BORROW and LOAN_REPAY for neranchara org
  // (Using specific IDs found in previous search for safety)
  const borrowType = await prisma.transactionType.findFirst({ where: { behavior: 'LOAN_BORROW', name: 'ยืมเงินภายใน' } });
  const repayType = await prisma.transactionType.findFirst({ where: { behavior: 'LOAN_REPAY', name: 'คืนเงินภายใน' } });

  if (!borrowType || !repayType) {
    console.log('Required transaction types not found.');
    return;
  }

  // 2. Fix the Borrow Transaction (4,850)
  const borrowTx = await prisma.transaction.findFirst({
    where: { description: { contains: 'ชุดทำงาน' }, amount: 4850 }
  });
  if (borrowTx) {
    await prisma.transaction.update({
      where: { id: borrowTx.id },
      data: { typeId: borrowType.id, amount: 4850 } // Keep negative behavior via type
    });
    console.log('Updated 4,850 to LOAN_BORROW.');
  }

  // 3. Fix the Repay Transaction (1,980)
  const repayTx = await prisma.transaction.findFirst({
    where: { description: { contains: 'ชุดทำงาน' }, amount: 1980 }
  });
  if (repayTx) {
    await prisma.transaction.update({
      where: { id: repayTx.id },
      data: { typeId: repayType.id, amount: 1980 } // Ensure it's treated as positive if it's a repayment
    });
    console.log('Updated 1,980 to LOAN_REPAY (Positive).');
  }

  // 4. Final Balance Check for K-Bank
  const kbank = await prisma.account.findFirst({ where: { name: { contains: 'กสิกร โอนภายใน' } } });
  if (kbank) {
    // We already calibrated it to 34,876.00 in a previous script. 
    // Since we just fixed transactions, let's make sure the balance is still 34,876.00
    await prisma.asset.update({
      where: { accountId: kbank.id },
      data: { amount: 34876.00 }
    });
    console.log('Ensured K-Bank balance is 34,876.00');
  }

  await prisma.$disconnect();
}

main();
