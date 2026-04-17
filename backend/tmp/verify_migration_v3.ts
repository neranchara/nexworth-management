import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Production Data Decoupling Verification ---');
  
  const totalTx = await prisma.transaction.count();
  const linkedTx = await prisma.transaction.count({
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
  
  console.log(`Transactions: ${linkedTx}/${totalTx} linked`);
  console.log(`Loans: ${linkedLoans}/${totalLoans} linked`);
  
  if (totalTx === linkedTx && totalLoans === linkedLoans) {
    console.log('--- DECOUPLING VERIFIED IN PROD ---');
  } else {
    console.log('--- DECOUPLING FAILED: Orphan records found ---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
