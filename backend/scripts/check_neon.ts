import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function main() {
  console.log('--- NEON DATABASE CHECK ---');
  const accs = await prisma.account.findMany({
    where: { accountNumber: '0303501991' }
  });
  
  if (accs.length === 0) {
    console.log('No Cloud Pocket accounts found in Neon.');
  } else {
    accs.forEach(a => {
      console.log(`ID: ${a.id}, Name: ${a.name}, AccNum: ${a.accountNumber}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
