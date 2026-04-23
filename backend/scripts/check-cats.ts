
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const transferOutCat = await prisma.transactionCategory.findFirst({ 
      where: { name: 'โอนออกภายใน' },
      include: { type: true }
  });
  console.log("Transfer Out Cat:", transferOutCat);
  
  const savingCat = await prisma.transactionCategory.findUnique({
      where: { id: "598e3174-e46b-4dab-ba59-113fbacccd63" },
      include: { type: true }
  });
  console.log("Saving Cat:", savingCat);
}

main().finally(() => prisma.$disconnect());
