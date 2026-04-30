import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_p6yThKgD1CQS@ep-floral-waterfall-aosnkmof.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" } }
});

async function main() {
  const accs = await prisma.account.findMany({
    where: { organization: { name: 'neranchara' } },
    include: { asset: true, liability: true, transactions: { include: { type: true } } }
  });

  const report = accs.map(acc => {
    const stored = acc.asset?.amount || acc.liability?.amount || 0;
    let calc = 0;
    acc.transactions.forEach(tx => {
      if (tx.type.behavior === 'INCOME') calc += tx.amount;
      if (tx.type.behavior === 'EXPENSE') calc -= tx.amount;
    });
    return {
      Account: acc.name,
      'Stored Balance': stored.toLocaleString(),
      'Calculated (TX)': calc.toLocaleString(),
      Status: Math.abs(stored - calc) < 0.01 ? '✅ MATCH' : '❌ MISMATCH'
    };
  });

  console.table(report);
  await prisma.$disconnect();
}

main().catch(console.error);
