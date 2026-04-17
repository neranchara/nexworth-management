import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Account Balance Synchronization ---');

  const accounts = await prisma.account.findMany({
    include: { organization: true }
  });

  for (const account of accounts) {
    console.log(`Syncing Account: ${account.name} (ID: ${account.id})`);

    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      include: { type: true }
    });

    let newBalance = 0; // Starting from 0 because seed sets initial balance to 0

    for (const tx of transactions) {
      const behavior = tx.type.behavior;
      const amount = tx.amount;
      const isLiability = account.type === 'LIABILITY';
      let multiplier = 0;

      if (isLiability) {
        if (['EXPENSE', 'DEBT', 'LOAN_BORROW'].includes(behavior)) {
          multiplier = 1;
        } else if (['INCOME', 'LOAN_REPAY', 'INTERNAL_TRANSFER', 'SAVING_INVESTMENT'].includes(behavior)) {
          multiplier = -1;
        }
      } else {
        if (['INCOME', 'SAVING_INVESTMENT', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW'].includes(behavior)) {
          multiplier = 1;
        } else if (['EXPENSE', 'DEBT'].includes(behavior)) {
          multiplier = -1;
        }
      }

      newBalance += (amount * multiplier);
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { balance: newBalance }
    });

    console.log(`Updated Balance: ${newBalance}`);
  }

  console.log('--- Synchronization Completed ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
