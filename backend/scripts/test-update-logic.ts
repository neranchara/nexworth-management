
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const existingId = 'cc2c2b6c-d162-4e98-b04a-452d70a527e5';
  
  // Existing transaction
  const existing = await prisma.transaction.findUnique({ where: { id: existingId }, include: { category: { include: { type: true } } } });
  
  console.log("Mocking updateTransactionHandler logic...");
  const body = {
    fromAccountId: 'SOME_DUMMY_ID',
    toAccountId: existing!.accountId, // Main Bank
    categoryId: existing!.categoryId,
    typeId: existing!.typeId,
    amount: existing!.amount,
    date: existing!.date
  };

  const categoryBehavior = existing!.category.type.behavior; // INVESTMENT
  const isTransferIntent = !!(body.fromAccountId && body.toAccountId) && (
      ['INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL_SAVING', 'DEBT', 'EXPENSE', 'INCOME'].includes(categoryBehavior)
  );
  
  console.log({ categoryBehavior, isTransferIntent });
  
  const wasTransfer = !!existing!.linkedTransactionId;
  console.log({ wasTransfer });
  
  // Let's see what happens inside isTransferIntent && !wasTransfer
  if (isTransferIntent && !wasTransfer) {
      console.log("Entered conversion logic!");
      const isExistingExpense = categoryBehavior === 'EXPENSE' || categoryBehavior === 'DEBT';
      console.log({ isExistingExpense });
      
      let targetLinkedAccountId = isExistingExpense ? body.toAccountId : body.fromAccountId;
      console.log({ targetLinkedAccountId });
      
      if (!isExistingExpense) {
          console.log("Will create EXPENSE leg on fromAccountId!");
      }
  } else {
      console.log("Did not enter conversion logic!");
  }
}

main().finally(() => prisma.$disconnect());
