import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const user = await prisma.user.findFirst({
    where: { email: 'neranchara.ksr@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }

  const kbank = await prisma.account.findFirst({
    where: { name: { contains: 'กสิกร โอนภายใน' } }
  });
  
  if (!kbank) {
    console.log('K-Bank account not found');
    return;
  }

  // Create the "Loan Container"
  const loan = await prisma.loan.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      accountId: kbank.id,
      name: 'ชุดทำงาน'
    }
  });

  // Link the existing transactions to this loan
  const txs = await prisma.transaction.findMany({
    where: { 
      description: { contains: 'ชุดทำงาน' },
      accountId: kbank.id
    }
  });

  for (const tx of txs) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { loanId: loan.id }
    });
  }

  console.log(`Successfully created Loan record (ID: ${loan.id}) and linked ${txs.length} transactions.`);
  
  await prisma.$disconnect();
}

main();
