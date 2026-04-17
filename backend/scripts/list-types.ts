import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const types = await prisma.transactionType.findMany({ select: { id: true, name: true, behavior: true } });
  console.log('--- TRANSACTION TYPES ---');
  types.forEach(t => console.log(`${t.name} (Behavior: ${t.behavior}) -> ${t.id}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
