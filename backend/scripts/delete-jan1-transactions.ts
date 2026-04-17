import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const jan1 = new Date('2026-01-01T00:00:00Z');

  console.log('Finding Jan 1, 2026 transactions...');
  const transactions = await prisma.transaction.findMany({
    where: {
      date: jan1
    }
  });

  console.log(`Found ${transactions.length} transactions. Deleting...`);
  
  const deleted = await prisma.transaction.deleteMany({
    where: {
      date: jan1
    }
  });

  console.log(`Successfully deleted ${deleted.count} transactions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
