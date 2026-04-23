
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      description: { contains: 'Shopping' }
    },
    include: { 
      type: true, 
      category: true, 
      account: { include: { bank: true } },
      linkedTransaction: { include: { account: { include: { bank: true } } } }
    }
  });

  console.log("Transactions matching 'Shopping':");
  console.table(txs.map(t => ({
    id: t.id,
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name,
    account: t.account.name,
    linkedTo: t.linkedTransaction?.account?.name || 'None'
  })));
}

main().finally(() => prisma.$disconnect());
