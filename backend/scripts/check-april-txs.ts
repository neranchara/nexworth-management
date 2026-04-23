
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      organizationId: '32839490-a7f5-4730-a78f-0923f494bf47',
      date: {
        gte: new Date(2026, 3, 1),
        lt: new Date(2026, 4, 1)
      }
    },
    include: { type: true, category: true }
  });

  console.log("April 2026 Transactions:");
  console.table(txs.map(t => ({
    id: t.id,
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name
  })));
}

main().finally(() => prisma.$disconnect());
