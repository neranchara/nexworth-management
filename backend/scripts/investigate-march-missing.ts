
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

  console.log("March Transactions:");
  const summary = txs.map(t => ({
    id: t.id,
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name,
    isInternal: t.category?.name?.includes('ภายใน') || t.type.behavior === 'INTERNAL_TRANSFER'
  }));

  console.table(summary.filter(s => ['GOAL_SAVING', 'INVESTMENT'].includes(s.behavior)));
}

main().finally(() => prisma.$disconnect());
