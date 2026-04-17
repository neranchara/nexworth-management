import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assetCount = await prisma.asset.count();
  const liabilityCount = await prisma.liability.count();
  const txCount = await prisma.transaction.count();
  const linkedTxCount = await prisma.transaction.count({
    where: {
      OR: [
        { assetId: { not: null } },
        { liabilityId: { not: null } }
      ]
    }
  });

  console.log(`Assets: ${assetCount}`);
  console.log(`Liabilities: ${liabilityCount}`);
  console.log(`Total Transactions: ${txCount}`);
  console.log(`Linked Transactions: ${linkedTxCount}`);
  
  if (txCount === linkedTxCount) {
    console.log('--- DECOUPLING VERIFIED ---');
  } else {
    console.log('--- DECOUPLING FAILED: Unlinked transactions found ---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
