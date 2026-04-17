import { PrismaClient } from './src/generated/client/index.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:nop@ssw0rd@localhost:5432/prod_nexworth_db?schema=public'
    }
  }
});

async function check() {
  const orgs = await prisma.organization.findMany();
  const users = await prisma.user.findMany();
  const accounts = await prisma.account.findMany();
  const txs = await prisma.transaction.findMany();

  console.log('--- DATABASE STATE ---');
  console.log(`Organizations: ${orgs.length}`);
  orgs.forEach(o => console.log(` - ${o.name} (${o.id})`));
  
  console.log(`\nUsers: ${users.length}`);
  users.forEach(u => console.log(` - ${u.email} (Org: ${u.organizationId})`));

  console.log(`\nAccounts: ${accounts.length}`);
  accounts.forEach(a => console.log(` - ${a.name} (Org: ${a.organizationId}, Type: ${a.type}, Balance: ${a.balance})`));

  console.log(`\nTransactions: ${txs.length}`);
  
  await prisma.$disconnect();
}

check().catch(console.error);
