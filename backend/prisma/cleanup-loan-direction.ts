import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Data Cleanup: Single Leg Loan/Transfer Out ---');
  
  const transactions = await prisma.transaction.findMany({
    where: { 
        linkedTransactionId: null,
        OR: [
            { category: { name: { contains: 'โอนออก' } } },
            { category: { name: { contains: 'ยืม' } } },
            { type: { behavior: 'LOAN_BORROW' } },
            { type: { behavior: 'LOAN_REPAY' } }
        ]
    },
    include: {
        category: true,
        type: true
    }
  });

  console.log(`Found ${transactions.length} potential records to fix.`);
  let count = 0;

  for (const tx of transactions) {
    // Force direction to 'FROM' for these specific cases
    if (tx.direction !== 'FROM') {
        await prisma.transaction.update({
            where: { id: tx.id },
            data: { direction: 'FROM' }
        });
        count++;
        console.log(`Updated Tx ID ${tx.id}: Category "${tx.category.name}" -> direction: FROM`);
    }
  }

  console.log(`--- Finished Cleanup: Updated ${count} transactions ---`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
