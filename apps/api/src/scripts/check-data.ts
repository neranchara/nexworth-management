import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const txs = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Latest Transactions:', JSON.stringify(txs, null, 2));
    
    const banks = await prisma.bank.findMany({ take: 3 });
    console.log('Banks:', JSON.stringify(banks, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
