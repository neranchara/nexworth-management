
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.transactionCategory.findFirst({
    where: { name: 'ยืมเงินภายใน' },
    include: { type: true }
  });
  console.log("Category:", cat);

  const loan = await prisma.loan.findUnique({
    where: { id: "dfb71216-006f-4ecc-961f-64a691d45aea" }
  });

  if (cat && loan) {
    const tx = await prisma.transaction.create({
      data: {
        accountId: loan.accountId,
        categoryId: cat.id,
        typeId: cat.typeId,
        organizationId: loan.organizationId,
        userId: loan.userId,
        amount: loan.totalAmount,
        description: "รายการตั้งต้น: " + loan.name,
        date: loan.date,
        actualDate: loan.actualDate,
        loanId: loan.id
      }
    });
    console.log("Created transaction:", tx);
  }
}

main().finally(() => prisma.$disconnect());
