import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres:nop@ssw0rd@localhost:5432/prod_nexworth_db?schema=public";
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const accountName = 'กสิกร โอนภายใน';
  const acc = await prisma.account.findFirst({ where: { name: accountName } });
  
  if (!acc) {
    console.log('Account not found');
    return;
  }

  const txs = await prisma.transaction.findMany({
    where: { accountId: acc.id },
    include: { category: { include: { type: true } } }
  });

  console.log(`--- Transactions for ${accountName} ---`);
  let sum = 0;
  txs.forEach(tx => {
    const behavior = tx.category?.type.behavior;
    const isLiability = acc.type === 'LIABILITY';
    let multiplier = 0;

    if (isLiability) {
      if (['INCOME', 'DEBT', 'LOAN_REPAY', 'INTERNAL_TRANSFER'].includes(behavior!)) {
        multiplier = 1;
      } else if (['EXPENSE', 'LOAN_BORROW', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING'].includes(behavior!)) {
        multiplier = -1;
      }
    } else {
      if (['INCOME', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW'].includes(behavior!)) {
        multiplier = 1;
      } else if (['EXPENSE', 'DEBT'].includes(behavior!)) {
        multiplier = -1;
      }
    }

    const adj = tx.amount * multiplier;
    sum += adj;
    console.log(`[${tx.date.toISOString().slice(0,10)}] ${behavior?.padEnd(15)} | Amt: ${tx.amount.toLocaleString().padStart(10)} | Adj: ${adj.toLocaleString().padStart(10)} | Cat: ${tx.category?.name}`);
  });

  console.log('-------------------------------------------');
  console.log(`Calculated Sum: ${sum.toLocaleString()}`);
  
  const asset = await prisma.asset.findUnique({ where: { accountId: acc.id } });
  console.log(`Stored Asset Amount: ${asset?.amount.toLocaleString()}`);
}

main().finally(() => prisma.$disconnect());
