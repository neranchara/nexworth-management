import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- RECALCULATING BALANCES BASED ON BEHAVIOR ---');

  const org = await prisma.organization.findFirst({ where: { name: 'neranchara' } });
  if (!org) return console.error('Org not found.');

  const accounts = await prisma.account.findMany({
    where: { organizationId: org.id },
    include: { transactions: { include: { type: true } } }
  });

  console.log(`Processing ${accounts.length} accounts...`);

  for (const acc of accounts) {
    let finalBalance = 0;
    const isLiability = acc.type === 'LIABILITY';

    for (const tx of acc.transactions) {
      const behavior = tx.type.behavior;
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

      finalBalance += (tx.amount * multiplier);
    }

    console.log(`Account: ${acc.name} | New Balance: ${finalBalance.toLocaleString()}`);

    // Update DB
    if (isLiability) {
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

  console.log('--- RECALCULATION COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

main().catch(console.error);
