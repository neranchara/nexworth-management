import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Transaction & Loan Migration (Fixed Path) ---');
  
  const assets = await prisma.asset.findMany();
  const liabilities = await prisma.liability.findMany();
  
  const assetMap = new Map(assets.map(a => [a.accountId, a.id]));
  const liabilityMap = new Map(liabilities.map(l => [l.accountId, l.id]));
  
  const transactions = await prisma.transaction.findMany();
  console.log(`Analyzing ${transactions.length} transactions...`);
  
  for (const tx of transactions) {
    const assetId = assetMap.get(tx.accountId);
    const liabilityId = liabilityMap.get(tx.accountId);
    
    if (assetId || liabilityId) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { assetId, liabilityId }
      });
    }
  }
  
  const loans = await prisma.loan.findMany();
  console.log(`Analyzing ${loans.length} loans...`);
  for (const loan of loans) {
    const assetId = assetMap.get(loan.accountId);
    const liabilityId = liabilityMap.get(loan.accountId);
    
    if (assetId || liabilityId) {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { assetId, liabilityId }
      });
    }
  }
  
  console.log('--- Migration Completed ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
