
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      description: { contains: '020125686467' }
    },
    include: { account: true }
  });

  console.log('Found transactions containing "020125686467":');
  console.log(JSON.stringify(txs.map(t => ({ 
    id: t.id, 
    desc: t.description, 
    amount: t.amount, 
    account: t.account.name,
    linkedId: t.linkedTransactionId 
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
