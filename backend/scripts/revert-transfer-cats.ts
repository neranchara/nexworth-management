
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const expenseType = await prisma.transactionType.findFirst({ where: { behavior: 'EXPENSE' } });
  if (expenseType) {
    await prisma.transactionCategory.updateMany({
      where: { name: 'โอนออกภายใน' },
      data: { typeId: expenseType.id }
    });
    console.log('โอนออกภายใน reverted to EXPENSE behavior.');
  }

  const incomeType = await prisma.transactionType.findFirst({ where: { behavior: 'INCOME' } });
  if (incomeType) {
    await prisma.transactionCategory.updateMany({
      where: { name: 'โอนเข้าภายใน' },
      data: { typeId: incomeType.id }
    });
    console.log('โอนเข้าภายใน reverted to INCOME behavior.');
  }
}

main().finally(() => prisma.$disconnect());
