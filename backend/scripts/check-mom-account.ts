
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.findUnique({ where: { id: 'e118748e-8fe5-4c36-a119-6555f6af4160' } });
  console.log(account);
}

main().finally(() => prisma.$disconnect());
