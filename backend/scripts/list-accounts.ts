
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const accs = await prisma.account.findMany();
  console.log(JSON.stringify(accs.map(a => ({ name: a.name, id: a.id })), null, 2));
}

main().finally(() => prisma.$disconnect());
