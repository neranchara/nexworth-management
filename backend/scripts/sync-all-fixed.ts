
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Global Balance Sync ---');
  
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
    console.log(`Processing Account: ${acc.name} (${acc.id})`);
    
    // 1. Get Initial Balance from earliest record
    const initialRecord = acc.financialRecords.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const initialAmount = initialRecord ? initialRecord.amount : 0;
    
    // 2. Sum Transactions
    let txSum = 0;
    for (const tx of acc.transactions) {
        const behavior = tx.type.behavior;
        const isLiability = acc.type === 'LIABILITY';
        let multiplier = 0;
        
        if (isLiability) {
            if (['INCOME', 'DEBT', 'LOAN_REPAY', 'INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT'].includes(behavior)) {
                multiplier = -1; // Money coming in (Income/Transfer In) reduces debt
            } else if (['EXPENSE', 'LOAN_BORROW', 'GOAL_SAVING'].includes(behavior)) {
                multiplier = 1; // Spending increases debt
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
    
    const finalBalance = initialAmount + txSum;
    console.log(`   - Initial: ${initialAmount}, TxSum: ${txSum}, Final: ${finalBalance}`);

    // 3. Update DB
    if (acc.type === 'LIABILITY') {
      await prisma.liability.upsert({
        where: { accountId: acc.id },
        update: { amount: finalBalance },
        create: { accountId: acc.id, amount: finalBalance, userId: acc.userId, organizationId: acc.organizationId }
      });
    } else {
      await prisma.asset.upsert({
        where: { accountId: acc.id },
        update: { amount: finalBalance },
        create: { accountId: acc.id, amount: finalBalance, userId: acc.userId, organizationId: acc.organizationId }
      });
    }
  }

  console.log('--- Sync Completed ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
