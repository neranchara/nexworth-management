
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.transaction.findUnique({ 
    where: { id: 'cc2c2b6c-d162-4e98-b04a-452d70a527e5' },
    include: { category: { include: { type: true } }, account: true }
  });
  console.log(JSON.stringify(tx, null, 2));

  if (tx?.linkedTransactionId) {
    const linkedTx = await prisma.transaction.findUnique({
      where: { id: tx.linkedTransactionId },
      include: { category: { include: { type: true } }, account: true }
    });
    console.log('--- LINKED TX ---');
    console.log(JSON.stringify(linkedTx, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
