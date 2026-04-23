
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      description: { contains: 'เงินเดือนแม่' } 
    },
    include: {
      type: true,
      category: true,
      account: true
    }
  });

  console.log('FOUND_TRANSACTIONS');
  console.log(JSON.stringify(txs, null, 2));
}

main().finally(() => prisma.$disconnect());
