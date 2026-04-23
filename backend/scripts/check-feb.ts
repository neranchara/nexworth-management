
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const febStart = new Date('2026-02-01T00:00:00Z');
  const febEnd = new Date('2026-02-28T23:59:59Z');

  const txs = await prisma.transaction.findMany({
    where: {
      date: { gte: febStart, lte: febEnd }
    },
    include: {
      type: true,
      category: true,
      account: true
    }
  });

  console.log("Feb Behaviors:", [...new Set(txs.map(t => t.type.behavior))]);
  
  const goalInvest = txs.filter(t => 
    ['GOAL_SAVING', 'INVESTMENT'].includes(t.type.behavior)
  );

  console.log("Feb Goal/Invest Transactions:");
  console.table(goalInvest.map(t => ({
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name,
    acc: t.account.name
  })));
}

main().finally(() => prisma.$disconnect());
