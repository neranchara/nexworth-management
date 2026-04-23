
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Deletion of All Carry-Forward Transactions ---');
  
  const txs = await prisma.transaction.findMany({
    where: { 
      description: {
        contains: 'ยกยอดจากปี 2025'
      }
    }
  });

  console.log(`Found ${txs.length} carry-forward transactions.`);

  if (txs.length > 0) {
    const ids = txs.map(t => t.id);
    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`Deleted ${result.count} transactions.`);
  }

  console.log('--- Deletion Completed ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
