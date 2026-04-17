import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Decoupling Verification (Custom Client) ---');
  
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

  const totalLoans = await prisma.loan.count();
  const linkedLoans = await prisma.loan.count({
    where: {
      OR: [
        { assetId: { not: null } },
        { liabilityId: { not: null } }
      ]
    }
  });

  console.log(`Assets: ${assetCount}`);
  console.log(`Liabilities: ${liabilityCount}`);
  console.log(`Transactions: ${linkedTxCount}/${txCount} linked`);
  console.log(`Loans: ${linkedLoans}/${totalLoans} linked`);
  
  if (txCount === linkedTxCount && totalLoans === linkedLoans) {
    console.log('--- DECOUPLING VERIFIED IN PROD ---');
  } else {
    console.log('--- DECOUPLING FAILED: Unlinked records found ---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
