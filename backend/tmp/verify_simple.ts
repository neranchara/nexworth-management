import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany({ include: { transactions: true } });
  let totalLinkedTx = 0;
  assets.forEach(a => totalLinkedTx += a.transactions.length);
  
  const totalTx = await prisma.transaction.count();
  
  console.log(`Assets: ${assets.length}`);
  console.log(`Transactions linked via Assets: ${totalLinkedTx}`);
  console.log(`Total Transactions in DB: ${totalTx}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
