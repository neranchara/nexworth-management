
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

const adjustAccountBalance = async (accountId: string, amount: number, typeId: string, isRemoval: boolean = false) => {
  const [account, type] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.transactionType.findUnique({ where: { id: typeId } })
  ]);
  
  if (!account || !type) return;

  const behavior = type.behavior;
  const isLiability = account.type === 'LIABILITY';
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

  const finalAdjustment = isRemoval ? -(amount * multiplier) : (amount * multiplier);

  if (isLiability) {
    await prisma.liability.upsert({
      where: { accountId },
      update: { amount: { increment: finalAdjustment } },
      create: { accountId, amount: finalAdjustment, userId: account.userId, organizationId: account.organizationId }
    });
  } else {
    await prisma.asset.upsert({
      where: { accountId },
      update: { amount: { increment: finalAdjustment } },
      create: { accountId, amount: finalAdjustment, userId: account.userId, organizationId: account.organizationId }
    });
  }
};

async function main() {
  console.log('--- Starting Bad Links Cleanup ---');
  
  const txs = await prisma.transaction.findMany({ 
    where: { linkedTransactionId: { not: null } }, 
    include: { 
      category: { include: { type: true } },
      account: true
    } 
  });

  const transferBehaviors = ['INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL_SAVING', 'DEBT'];
  const bad = txs.filter(t => !transferBehaviors.includes(t.category.type.behavior));

  console.log(`Found ${bad.length} transactions with bad links.`);

  for (const t of bad) {
    // If it's the primary EXPENSE leg, we want to unlink it and delete the linked leg.
    if (t.category.type.behavior === 'EXPENSE') {
       console.log(`Fixing Expense: ${t.description} (${t.amount}) on ${t.account.name}`);
       
       const linkedId = t.linkedTransactionId;
       if (!linkedId) continue;

       const linkedTx = await prisma.transaction.findUnique({ where: { id: linkedId } });
       if (linkedTx) {
          // 1. Unlink primary
          await prisma.transaction.update({
             where: { id: t.id },
             data: { linkedTransactionId: null }
          });

          // 2. Adjust balance for linked leg (removal)
          await adjustAccountBalance(linkedTx.accountId, linkedTx.amount, linkedTx.typeId, true);

          // 3. Delete linked leg
          await prisma.transaction.delete({ where: { id: linkedId } });
          console.log(`   - Deleted linked leg ID: ${linkedId} and adjusted balance.`);
       }
    }
  }

  console.log('--- Cleanup Completed ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
