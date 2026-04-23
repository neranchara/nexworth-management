
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const marchStart = new Date('2026-03-01T00:00:00Z');
  const marchEnd = new Date('2026-03-31T23:59:59Z');

  const txs = await prisma.transaction.findMany({
    where: {
      date: { gte: marchStart, lte: marchEnd }
    },
    include: {
      type: true,
      category: true,
      account: true
    }
  });

  console.log("March Transactions Count:", txs.length);
  
  const byBehavior = {};
  txs.forEach(t => {
    const b = t.type.behavior;
    byBehavior[b] = (byBehavior[b] || 0) + 1;
  });
  console.log("By Behavior:", byBehavior);

  const goalInvest = txs.filter(t => 
    t.description.includes('Goal') || 
    t.description.includes('Invest') || 
    t.description.includes('เป้าหมาย') || 
    t.description.includes('ลงทุน') ||
    t.category?.name?.includes('เป้าหมาย') ||
    t.category?.name?.includes('ลงทุน')
  );

  console.log("Likely Goal/Invest Transactions:");
  console.table(goalInvest.map(t => ({
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name,
    acc: t.account.name
  })));
}

main().finally(() => prisma.$disconnect());
