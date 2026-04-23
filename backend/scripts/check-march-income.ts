
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const marchStart = new Date('2026-03-01T00:00:00Z');
  const marchEnd = new Date('2026-03-31T23:59:59Z');

  const txs = await prisma.transaction.findMany({
    where: {
      date: { gte: marchStart, lte: marchEnd },
      type: { behavior: { in: ['INCOME', 'LOAN_BORROW'] } }
    },
    include: {
      type: true,
      category: true,
      account: true
    }
  });

  const validIncome = txs.filter(t => {
    const isInternal = t.category?.name?.includes('ภายใน') || t.type.behavior === 'INTERNAL_TRANSFER';
    return !isInternal;
  });

  console.log("March Valid Income Transactions:");
  console.table(validIncome.map(t => ({
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name
  })));
  console.log("Total:", validIncome.reduce((sum, t) => sum + t.amount, 0));
}

main().finally(() => prisma.$disconnect());
