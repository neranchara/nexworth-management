import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:nop@ssw0rd@localhost:5432/stg_nexworth_db?schema=public" } }
});

async function main() {
  const tx = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: { organization: true }
  });
  console.log('--- LATEST TRANSACTIONS IN LOCAL STAGING ---');
  console.table(tx.map(t => ({
    CreatedAt: t.createdAt,
    Amount: t.amount,
    Desc: t.description,
    Org: t.organization?.name
  })));
  await prisma.$disconnect();
}

main().catch(console.error);
