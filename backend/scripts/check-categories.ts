
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.transactionCategory.findMany({ include: { type: true } });
  console.log(JSON.stringify(cats.map(c => ({ name: c.name, behavior: c.type.behavior })), null, 2));
}

main().finally(() => prisma.$disconnect());
