import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allTx = await prisma.transaction.findMany({ take: 10 });
  console.log('Sample Transactions:');
  allTx.forEach(tx => console.log(`ID: ${tx.id}, accId: ${tx.accountId}, assetId: ${tx.assetId}, liabilityId: ${tx.liabilityId}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
