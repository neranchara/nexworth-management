import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

if (fs.existsSync('.env.production')) {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          accounts: true,
          transactions: true,
          users: true
        }
      }
    }
  });

  console.log('--- ALL ORGANIZATIONS ---');
  orgs.forEach(o => {
    console.log(`- ${o.name} (ID: ${o.id})`);
    console.log(`  Users: ${o._count.users}, Accounts: ${o._count.accounts}, Transactions: ${o._count.transactions}`);
  });

  const allAccounts = await prisma.account.findMany({
    select: { name: true, organization: { select: { name: true } } }
  });

  console.log('\n--- ALL ACCOUNTS IN DB ---');
  allAccounts.forEach(a => {
    console.log(`- ${a.name} [Org: ${a.organization?.name || 'N/A'}]`);
  });
}

main().finally(() => prisma.$disconnect());
