
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      organizationId: '32839490-a7f5-4730-a78f-0923f494bf47',
      date: {
        gte: new Date(2026, 2, 1),
        lt: new Date(2026, 3, 1)
      }
    },
    include: { type: true, category: true }
  });

  const expenseTxs = txs.filter(t => t.type.behavior === 'EXPENSE');
  console.log("March 2026 Expense Transactions:");
  console.table(expenseTxs.map(t => ({
    desc: t.description,
    amt: t.amount,
    cat: t.category?.name
  })));
  
  const total = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  console.log("Total March Expense:", total);
}

main().finally(() => prisma.$disconnect());
