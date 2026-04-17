import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orphanTransactions = await prisma.transaction.count({
    where: { assetId: null, liabilityId: null }
  });
  
  const orphanLoans = await prisma.loan.count({
    where: { assetId: null, liabilityId: null }
  });
  
  console.log(`Orphan Transactions: ${orphanTransactions}`);
  console.log(`Orphan Loans: ${orphanLoans}`);
  
  if (orphanTransactions === 0 && orphanLoans === 0) {
    console.log('--- Phase 1 Migration Verified in Prod ---');
  } else {
    console.log('--- Phase 1 Migration Verification FAILED in Prod ---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
