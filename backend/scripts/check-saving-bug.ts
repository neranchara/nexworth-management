
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({ 
    where: { description: 'ออมกสิกร' },
    include: { category: { include: { type: true } }, account: true }
  });
  console.log(JSON.stringify(txs, null, 2));
}

main().finally(() => prisma.$disconnect());
