
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const transaction = await prisma.transaction.findFirst({
    where: { 
      description: 'ยกยอดจากปี 2025', 
      account: { name: 'บัญชีหลัก (กรุงเทพ)' } 
    }
  });

  if (transaction) {
    console.log('FOUND_TRANSACTION');
    console.log(JSON.stringify(transaction, null, 2));
  } else {
    console.log('NOT_FOUND');
  }
}

main().finally(() => prisma.$disconnect());
