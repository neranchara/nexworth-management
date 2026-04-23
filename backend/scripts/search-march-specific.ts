
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const marchStart = new Date('2026-03-01T00:00:00Z');
  const marchEnd = new Date('2026-03-31T23:59:59Z');

  const txs = await prisma.transaction.findMany({
    where: {
      date: { gte: marchStart, lte: marchEnd },
      OR: [
        { description: { contains: 'บัญชีเงินซื้อรถ' } },
        { description: { contains: 'กองทุนสำรองเลี้ยงชีพ' } }
      ]
    },
    include: {
      type: true,
      category: true,
      account: true
    }
  });

  console.log("March specific matches:");
  console.table(txs.map(t => ({
    desc: t.description,
    amt: t.amount,
    behavior: t.type.behavior,
    cat: t.category?.name,
    acc: t.account.name
  })));
}

main().finally(() => prisma.$disconnect());
