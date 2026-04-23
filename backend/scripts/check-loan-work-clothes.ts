
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const loans = await prisma.loan.findMany({
    where: { 
      name: { contains: 'ชุดทำงาน' }
    },
    include: {
      transactions: true
    }
  });
  console.log("Loans found:", JSON.stringify(loans, null, 2));

  // Check if there are any transactions that might belong to this but lost connection
  const lostTxs = await prisma.transaction.findMany({
    where: {
      description: { contains: 'ชุดทำงาน' }
    }
  });
  console.log("Transactions with 'ชุดทำงาน':", JSON.stringify(lostTxs, null, 2));
}

main().finally(() => prisma.$disconnect());
