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
        category: { include: { type: true } },
        type: true
    }
  });

  console.log(`Found ${transactions.length} potential records to fix.`);
  let count = 0;

  for (const tx of transactions) {
    const behavior = (tx.type?.behavior || tx.category?.type?.behavior || '').toUpperCase();
    const catName = (tx.category?.name || '').toLowerCase();
    
    let targetDirection = 'FROM'; // Default
    
    // Logic: Borrowing = Money IN (TO), Repaying/Transfer Out = Money OUT (FROM)
    if (behavior === 'LOAN_BORROW' || catName.includes('ยืมเงินเข้า') || catName.includes('ยืม')) {
        targetDirection = 'TO';
    } else if (behavior === 'LOAN_REPAY' || catName.includes('คืน') || catName.includes('โอนออก')) {
        targetDirection = 'FROM';
    }

    if (tx.direction !== targetDirection) {
        await prisma.transaction.update({
            where: { id: tx.id },
            data: { direction: targetDirection }
        });
        count++;
        console.log(`Updated Tx ID ${tx.id}: "${catName}" [${behavior}] -> direction: ${targetDirection}`);
    }
  }

  console.log(`--- Finished Cleanup: Updated ${count} transactions ---`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
