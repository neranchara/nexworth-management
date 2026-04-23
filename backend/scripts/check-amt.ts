
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({ 
    where: { 
      amount: 46418 
    },
    include: { category: { include: { type: true } }, account: true }
  });
  console.log(JSON.stringify(txs.map(t => ({ id: t.id, cat: t.category?.name, acc: t.account?.name, date: t.date })), null, 2));
}

main().finally(() => prisma.$disconnect());
