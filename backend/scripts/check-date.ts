
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.transaction.findUnique({ where: { id: '6492207b-7dba-45ef-8b65-59d77b39c073' } });
  console.log('Date of linked tx:', tx?.date);
}

main().finally(() => prisma.$disconnect());
