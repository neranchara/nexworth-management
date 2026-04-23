
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const type = await prisma.transactionType.findFirst({ 
    where: { behavior: 'INTERNAL_TRANSFER' } 
  });
  
  if (type) {
    await prisma.transactionCategory.updateMany({ 
      where: { name: { in: ['โอนออกภายใน', 'โอนเข้าภายใน'] } }, 
      data: { typeId: type.id } 
    });
    console.log('Categories updated to INTERNAL_TRANSFER behavior.');
  } else {
    console.log('INTERNAL_TRANSFER type not found.');
  }
}

main().finally(() => prisma.$disconnect());
