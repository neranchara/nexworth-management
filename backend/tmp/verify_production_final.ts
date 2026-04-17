import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- FINAL PRODUCTION VERIFICATION ---');
  
  try {
    // 1. Check Transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        asset: { include: { account: true } },
        liability: { include: { account: true } }
      }
    });
    
    console.log(`Total Transactions: ${transactions.length}`);
    
    let linked = 0;
    let unlinked = 0;
    
    for (const tx of transactions) {
      if (tx.assetId || tx.liabilityId) {
        linked++;
      } else {
        unlinked++;
        console.error(`ERROR: Transaction ${tx.id} is NOT linked to Asset or Liability!`);
      }
    }
    
    console.log(`Linked Transactions: ${linked}`);
    if (unlinked > 0) console.error(`Unlinked Transactions: ${unlinked}`);

    // 2. Check Loans
    const loans = await prisma.loan.findMany({
      include: {
        asset: { include: { account: true } },
        liability: { include: { account: true } }
      }
    });

    console.log(`Total Loans: ${loans.length}`);
    
    let loansLinked = 0;
    let loansUnlinked = 0;
    
    for (const loan of loans) {
      if (loan.assetId || loan.liabilityId) {
        loansLinked++;
      } else {
        loansUnlinked++;
        console.error(`ERROR: Loan ${loan.id} is NOT linked to Asset or Liability!`);
      }
    }
    
    console.log(`Linked Loans: ${loansLinked}`);
    if (loansUnlinked > 0) console.error(`Unlinked Loans: ${loansUnlinked}`);

    // 3. Confirm Account Isolation
    // Attempting to access accounts.transactions should fail at compile time or return undefined if types are weird
    // But we'll just check if Asset/Liability are correctly populated
    const assets = await prisma.asset.findMany({ include: { transactions: true, loans: true } });
    const liabilities = await prisma.liability.findMany({ include: { transactions: true, loans: true } });

    console.log(`Total Assets in Prod: ${assets.length}`);
    console.log(`Total Liabilities in Prod: ${liabilities.length}`);

    const txInAssets = assets.reduce((acc, a) => acc + a.transactions.length, 0);
    const txInLiabilities = liabilities.reduce((acc, l) => acc + l.transactions.length, 0);
    
    console.log(`Total Transactions mapped via Asset/Liability: ${txInAssets + txInLiabilities}`);
    
    if (txInAssets + txInLiabilities === transactions.length) {
      console.log('SUCCESS: All transactions are correctly owned by Asset/Liability models.');
    } else {
      console.error('MISMATCH: Transaction count mismatch!');
    }

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
