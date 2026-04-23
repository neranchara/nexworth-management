
import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    include: {
      financialRecords: true,
      asset: true,
      liability: true,
      transactions: {
        include: { type: true }
      }
    }
  });

  for (const acc of accounts) {
    console.log(`Account: ${acc.name} (${acc.id})`);
    console.log(`  Current Asset Amount: ${acc.asset?.amount}`);
    console.log(`  Current Liability Amount: ${acc.liability?.amount}`);
    console.log(`  Financial Records:`, acc.financialRecords.map(r => ({ amount: r.amount, date: r.date, type: r.type })));
    let txSum = 0;
    for (const tx of acc.transactions) {
        const behavior = tx.type.behavior;
        const isLiability = acc.type === 'LIABILITY';
        let multiplier = 0;
        if (isLiability) {
            if (['INCOME', 'DEBT', 'LOAN_REPAY', 'INTERNAL_TRANSFER'].includes(behavior)) {
                multiplier = 1;
            } else if (['EXPENSE', 'LOAN_BORROW', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING'].includes(behavior)) {
                multiplier = -1;
            }
        } else {
            if (['INCOME', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW'].includes(behavior)) {
                multiplier = 1;
            } else if (['EXPENSE', 'DEBT'].includes(behavior)) {
                multiplier = -1;
            }
        }
        txSum += (tx.amount * multiplier);
    }
    console.log(`  Transaction Sum (calculated): ${txSum}`);
    console.log(`  Transactions:`, acc.transactions.map(t => ({ amount: t.amount, desc: t.description, date: t.date })));
    
    // Get Earliest Financial Record
    const initialRecord = acc.financialRecords.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const initialAmount = initialRecord ? initialRecord.amount : 0;
    console.log(`  Initial Balance (from earliest record): ${initialAmount}`);
    console.log(`  Expected Total: ${initialAmount + txSum}`);
    console.log(`  Current DB Total: ${acc.asset?.amount || acc.liability?.amount}`);
    console.log(`  Diff: ${(acc.asset?.amount || acc.liability?.amount || 0) - (initialAmount + txSum)}`);
    console.log('---');
  }
}

main().finally(() => prisma.$disconnect());
