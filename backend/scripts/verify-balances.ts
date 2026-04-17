import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({ select: { id: true, name: true, balance: true } });
  
  console.log('--- FINAL ACCOUNT BALANCES ---');
  accounts.forEach(a => {
    if (a.balance !== 0) {
      console.log(`${a.name}: ${a.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
