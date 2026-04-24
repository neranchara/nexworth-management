import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function main() {
  console.log('--- EXHAUSTIVE NEON SEARCH ---');
  const allAccounts = await prisma.account.findMany({
    include: { organization: true }
  });
  console.log(`Found ${allAccounts.length} accounts in total.`);
  
  allAccounts.forEach(a => {
    console.log(`- ${a.name} (Org: ${a.organization?.name}) -> AccNum: ${a.accountNumber}`);
    if (a.accountNumber === '0303501991') {
      console.log('  *** MATCH FOUND! ***');
    }
  });
}

main().finally(() => prisma.$disconnect());
