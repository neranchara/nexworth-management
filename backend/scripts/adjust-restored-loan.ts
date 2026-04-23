
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
  const tx = await prisma.transaction.findUnique({
    where: { id: '46647661-5318-4657-b816-98fcd100ca4f' }
  });

  if (tx) {
    await adjustAccountBalance(tx.accountId, tx.amount, tx.typeId);
    console.log("Account balance adjusted.");
  }
}

main().finally(() => prisma.$disconnect());
