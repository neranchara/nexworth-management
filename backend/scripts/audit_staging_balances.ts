import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:nop@ssw0rd@localhost:5432/stg_nexworth_db?schema=public" } }
});

async function main() {
  console.log('--- STAGING DATABASE BALANCE AUDIT ---');

  const accounts = await prisma.account.findMany({
    include: { asset: true, liability: true, bank: true, organization: true }
  });

  const data = accounts.map(a => ({
    Org: a.organization?.name || '-',
    Name: a.name,
    Bank: a.bank?.name || '-',
    Amount: a.asset?.amount || a.liability?.amount || 0
  }));

  console.table(data);
  await prisma.$disconnect();
}

main().catch(console.error);
