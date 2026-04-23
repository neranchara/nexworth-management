
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      date: {
        gte: new Date('2026-01-01'),
        lt: new Date('2026-02-01')
      },
      linkedTransactionId: null,
      description: {
        contains: 'ออม'
      }
    },
    include: { account: true, category: { include: { type: true } } }
  });

  console.log('Unlinked "ออม" transactions in Jan:');
  console.log(JSON.stringify(txs.map(t => ({ id: t.id, desc: t.description, amount: t.amount, account: t.account.name })), null, 2));
}

main().finally(() => prisma.$disconnect());
