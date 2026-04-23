
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.transactionCategory.findMany({
    where: { 
      name: { in: ['โอนเข้าภายใน', 'โอนออกภายใน'] }
    },
    include: { type: true }
  });
  console.log(JSON.stringify(cats, null, 2));
}

main().finally(() => prisma.$disconnect());
