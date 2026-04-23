
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.transactionType.findMany({
    where: { behavior: 'INTERNAL_TRANSFER' }
  });
  console.log("INTERNAL_TRANSFER types:", types);
  
  if (types.length > 0) {
    const cats = await prisma.transactionCategory.findMany({
      where: { typeId: { in: types.map(t => t.id) } }
    });
    console.log("Categories with INTERNAL_TRANSFER behavior:", cats);
  }
}

main().finally(() => prisma.$disconnect());
