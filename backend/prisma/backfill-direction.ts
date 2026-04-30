import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Backfill: Transaction Direction ---');
  
  const transactions = await prisma.transaction.findMany({
    where: { direction: null },
    include: {
        category: { include: { type: true } },
        type: true
    }
  });

  console.log(`Found ${transactions.length} transactions to update.`);
  let count = 0;

  for (const tx of transactions) {
    const behavior = (tx.type?.behavior || tx.category?.type?.behavior || '').toUpperCase();
    const catName = tx.category?.name || '';
    
    let direction = 'FROM'; // Default
    
    // Logic to determine direction for backfill
    if (behavior === 'INCOME' || catName === 'โอนเข้าภายใน' || catName.includes('รายรับ')) {
        direction = 'TO';
    } else {
        direction = 'FROM';
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { direction }
    });
    count++;
    if (count % 100 === 0) console.log(`Updated ${count}...`);
  }

  console.log(`--- Finished Backfill: Updated ${count} transactions ---`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
