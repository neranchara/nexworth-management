
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({ 
    where: { 
      description: {
        contains: 'กองทุนสำรองเลี้ยงชีพ'
      }
    },
    include: { category: { include: { type: true } }, account: true },
    orderBy: { date: 'asc' }
  });
  console.log(JSON.stringify(txs.map(t => ({ 
      id: t.id, 
      desc: t.description, 
      date: t.date, 
      actualDate: t.actualDate, 
      amt: t.amount, 
      acc: t.account?.name,
      cat: t.category?.name,
      linkedId: t.linkedTransactionId
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
