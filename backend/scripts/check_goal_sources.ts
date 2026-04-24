import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres:nop@ssw0rd@localhost:5432/prod_nexworth_db?schema=public";
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const goalTxs = await prisma.transaction.findMany({
    where: { account: { type: 'GOAL' } },
    include: { 
        account: true, 
        category: { include: { type: true } },
        linkedTransaction: { include: { account: true } }
    }
  });

  console.log('--- GOAL TRANSACTIONS & SOURCES ---');
  goalTxs.forEach(tx => {
    const source = tx.linkedTransaction ? tx.linkedTransaction.account?.name : 'NO LINKED TX';
    console.log(`[${tx.date.toISOString().slice(0,10)}] Goal: ${tx.account?.name.padEnd(25)} | Amt: ${tx.amount.toLocaleString().padStart(10)} | Source: ${source}`);
  });
}

main().finally(() => prisma.$disconnect());
