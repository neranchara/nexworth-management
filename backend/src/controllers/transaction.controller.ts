import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const transactionSchema = z.object({
  accountId: z.string().uuid().optional().nullable(),
  fromAccountId: z.string().uuid().optional().nullable(),
  toAccountId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid(),
  typeId: z.string().uuid().optional().nullable(),
  amount: z.number(),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  actualDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  direction: z.string().optional().nullable(),
});

export const adjustAccountBalance = async (accountId: string, amount: number, typeId: string, isRemoval: boolean = false) => {
  const [account, type] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.transactionType.findUnique({ where: { id: typeId } })
  ]);
  
  if (!account || !type) return;

  const behavior = type.behavior;
  const isLiability = account.type === 'LIABILITY';
  let multiplier = 0;

  if (isLiability) {
    if (['INCOME', 'DEBT', 'LOAN_REPAY', 'INTERNAL_TRANSFER'].includes(behavior)) {
      multiplier = 1;
    } else if (['EXPENSE', 'LOAN_BORROW', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING'].includes(behavior)) {
      multiplier = -1;
    }
  } else {
    if (['INCOME', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW'].includes(behavior)) {
      multiplier = 1;
    } else if (['EXPENSE', 'DEBT'].includes(behavior)) {
      multiplier = -1;
    }
  }

  const finalAdjustment = isRemoval ? -(amount * multiplier) : (amount * multiplier);

  if (isLiability) {
    await prisma.liability.upsert({
      where: { accountId },
      update: { amount: { increment: finalAdjustment } },
      create: { accountId, amount: finalAdjustment, userId: account.userId, organizationId: account.organizationId }
    });
  } else {
    await prisma.asset.upsert({
      where: { accountId },
      update: { amount: { increment: finalAdjustment } },
      create: { accountId, amount: finalAdjustment, userId: account.userId, organizationId: account.organizationId }
    });
  }
};

export const listTransactionsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { month, year } = request.query as { month?: string; year?: string };

    let whereClause: any = { organizationId: user.organizationId };

    if (year) {
      const startYear = parseInt(year);
      if (month) {
        const startMonth = parseInt(month) - 1;
        const startDate = new Date(startYear, startMonth, 1);
        const endDate = new Date(startYear, startMonth + 1, 0, 23, 59, 59, 999);
        whereClause.date = { gte: startDate, lte: endDate };
      } else {
        const startDate = new Date(startYear, 0, 1);
        const endDate = new Date(startYear, 11, 31, 23, 59, 59, 999);
        whereClause.date = { gte: startDate, lte: endDate };
      }
    }

    console.log(`[DEBUG-LIST] User Org ID: ${user.organizationId}`);
    console.log(`[DEBUG-LIST] Where Clause:`, JSON.stringify(whereClause, null, 2));

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: { include: { bank: { select: { name: true, color: true } } } },
        asset: true,
        liability: true,
        category: { include: { type: true } },
        type: true
      },
      orderBy: { date: 'desc' },
    });

    console.log(`[DEBUG-LIST] Found ${transactions.length} transactions`);
    return reply.send({ transactions });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = transactionSchema.parse(request.body);

    if (!body.accountId && !body.fromAccountId && !body.toAccountId) {
      return reply.status(400).send({ error: 'At least one account must be selected' });
    }

    body.amount = Math.abs(body.amount);

    const { accountId, fromAccountId, toAccountId, ...commonData } = body;
    
    // Fetch category to check behavior and ownership
    const category = await prisma.transactionCategory.findFirst({ 
      where: { 
        id: body.categoryId,
        organizationId: user.organizationId // IDOR Protection
      }, 
      include: { type: true } 
    });
    if (!category) return reply.status(400).send({ error: 'Category not found or unauthorized' });
    
    const transferBehaviors = ['INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL_SAVING', 'DEBT', 'EXPENSE', 'INCOME'];
    const isTransfer = (fromAccountId && toAccountId) && transferBehaviors.includes(category.type.behavior);
    const direction = body.direction;

    const processSingleLeg = async (accId: string, catId: string, tId: string, linkedId: string | null, legDirection: string | null = null) => {
        const account = await prisma.account.findFirst({ 
          where: { 
            id: accId,
            organizationId: user.organizationId // IDOR Protection
          } 
        });
        if (!account) throw new Error('Account not found or unauthorized');
        
        let assetId: string | null = null;
        let liabilityId: string | null = null;

        if (account.type === 'LIABILITY') {
          const liability = await prisma.liability.findUnique({ where: { accountId: accId } });
          liabilityId = liability?.id || null;
        } else {
          const asset = await prisma.asset.findUnique({ where: { accountId: accId } });
          assetId = asset?.id || null;
        }

        const transaction = await prisma.transaction.create({
          data: {
            ...commonData,
            accountId: accId,
            categoryId: catId,
            typeId: tId,
            userId: user.sub,
            organizationId: user.organizationId,
            assetId,
            liabilityId,
            linkedTransactionId: linkedId,
            direction: legDirection,
            date: commonData.date ? new Date(commonData.date) : new Date(),
            actualDate: commonData.actualDate ? new Date(commonData.actualDate) : null,
          },
          include: {
            account: { include: { bank: { select: { name: true, color: true } } } },
            asset: true,
            liability: true,
            category: { include: { type: true } },
            type: true
          }
        });

        await adjustAccountBalance(transaction.accountId, transaction.amount, transaction.typeId);
        return transaction;
    };

    const baseTypeId = category.typeId;

    if (isTransfer) {
        // Fetch toAccount to check if it's a personal account
        const toAccount = await prisma.account.findUnique({ where: { id: toAccountId as string } });
        
        let behaviorToUse = category.type.behavior;
        
        // --- Logic for Non-Personal Accounts ---
        // If transferring to an account that is NOT personal, treat it as an EXPENSE
        // unless it's explicitly an INVESTMENT (Lending money).
        if (toAccount && !toAccount.isPersonal && behaviorToUse !== 'INVESTMENT') {
            behaviorToUse = 'EXPENSE';
        }

        const isRequestedExpenseLike = ['EXPENSE', 'DEBT'].includes(behaviorToUse);
        
        if (isRequestedExpenseLike) {
            // --- EXPENSE TRANSFER (e.g. Salary for Mother, Debt Repayment) ---
            // The Source (From) is the primary leg that gets the user's category.
            const sourceTx = await processSingleLeg(fromAccountId as string, body.categoryId, baseTypeId as string, null, 'FROM');
            
            // The Destination (To) gets a generic "Transfer In" (Income) category.
            let incomeType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'INCOME' }});
            if (!incomeType) incomeType = await prisma.transactionType.findFirst({ where: { behavior: 'INCOME' }});
            
            let transferInCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนเข้าภายใน' } });
            if (!transferInCat) {
                transferInCat = await prisma.transactionCategory.create({ data: { name: 'โอนเข้าภายใน', organizationId: user.organizationId, typeId: incomeType!.id, isActive: true } });
            }
            
            const destTx = await processSingleLeg(toAccountId as string, transferInCat.id, incomeType!.id, sourceTx.id, 'TO');
            
            await prisma.transaction.update({
               where: { id: sourceTx.id },
               data: { linkedTransactionId: destTx.id }
            });
 
            return reply.status(201).send({ message: 'Expense transfer created successfully', transaction: sourceTx });
        } else {
            // --- INCOME/INVESTMENT/SAVING TRANSFER ---
            // The Destination (To) is the primary leg that gets the user's category.
            const destTx = await processSingleLeg(toAccountId as string, body.categoryId, baseTypeId as string, null, 'TO');
            
            // The Source (From) gets a generic "Transfer Out" (Expense) category.
            let expenseType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
            if (!expenseType) expenseType = await prisma.transactionType.findFirst({ where: { behavior: 'EXPENSE' }});
            
            let transferOutCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
            if (!transferOutCat) {
                transferOutCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });
            }
 
            const sourceTx = await processSingleLeg(fromAccountId as string, transferOutCat.id, expenseType!.id, destTx.id, 'FROM');
            
            await prisma.transaction.update({
               where: { id: destTx.id },
               data: { linkedTransactionId: sourceTx.id }
            });

            return reply.status(201).send({ message: 'Transfer created successfully', transaction: destTx });
        }
    } else {
        const targetAccId = accountId || fromAccountId || toAccountId;
        if (!targetAccId) return reply.status(400).send({ error: 'No account selected' });

        const tx = await processSingleLeg(targetAccId, body.categoryId, baseTypeId as string, null, direction);
        return reply.status(201).send({ message: 'Transaction created', transaction: tx });
    }

  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    const body = transactionSchema.parse(request.body);

    body.amount = Math.abs(body.amount);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Transaction not found or unauthorized' });
    }

    let categoryId = body.categoryId;
    const category = await prisma.transactionCategory.findFirst({ 
      where: { 
        id: categoryId,
        organizationId: user.organizationId // IDOR Protection
      }, 
      include: { type: true } 
    });
    if (!category) return reply.status(404).send({ error: 'Category not found or unauthorized' });
    
    let typeId = body.typeId || category.typeId;
    const categoryBehavior = category.type.behavior;

    // Sync linked transaction
    const linked = existing.linkedTransactionId 
      ? await prisma.transaction.findUnique({ where: { id: existing.linkedTransactionId } }) 
      : null;

    const existingType = await prisma.transactionType.findUnique({ where: { id: existing.typeId } });
    const behavior = existingType?.behavior;
    const isExistingExpense = behavior === 'EXPENSE' || behavior === 'DEBT';
    
    const isTransferIntent = !!(body.fromAccountId && body.toAccountId) && (
      ['INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL_SAVING', 'DEBT', 'EXPENSE', 'INCOME'].includes(categoryBehavior)
    );
    const wasTransfer = !!existing.linkedTransactionId;
    console.log('[DEBUG-UPDATE] id:', existing.id);
    console.log('[DEBUG-UPDATE] body.fromAccountId:', body.fromAccountId, 'body.toAccountId:', body.toAccountId);
    console.log('[DEBUG-UPDATE] categoryBehavior:', categoryBehavior);
    console.log('[DEBUG-UPDATE] isTransferIntent:', isTransferIntent, 'wasTransfer:', wasTransfer);

    // --- Category Routing for Transfers ---
    let primaryCategoryId = categoryId;
    let primaryTypeId = typeId;
    let linkedCategoryId: string | undefined = undefined;
    let linkedTypeId: string | undefined = undefined;

    if (wasTransfer && isTransferIntent) {
      let behaviorToUse = categoryBehavior;
      const targetToAccountId = body.toAccountId || (isExistingExpense ? linked!.accountId : existing.accountId);
      
      const toAccount = await prisma.account.findUnique({ where: { id: targetToAccountId } });
      if (toAccount && !toAccount.isPersonal && behaviorToUse !== 'INVESTMENT') {
        behaviorToUse = 'EXPENSE';
      }

      const isRequestedExpenseLike = ['EXPENSE', 'DEBT'].includes(behaviorToUse);

      if (isExistingExpense) {
        // --- WE ARE UPDATING THE "FROM" LEG (Primary for Expenses) ---
        if (isRequestedExpenseLike) {
           primaryCategoryId = categoryId;
           primaryTypeId = typeId;
           
           // Destination stays/becomes generic "Transfer In"
           let incomeType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'INCOME' }});
           if (!incomeType) incomeType = await prisma.transactionType.findFirst({ where: { behavior: 'INCOME' }});

           let transferInCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนเข้าภายใน' } });
           if (!transferInCat) transferInCat = await prisma.transactionCategory.create({ data: { name: 'โอนเข้าภายใน', organizationId: user.organizationId, typeId: incomeType!.id, isActive: true } });
           
           linkedCategoryId = transferInCat.id;
           linkedTypeId = incomeType!.id;
        } else {
           // USER CHANGED TYPE FROM EXPENSE TO INVESTMENT/SAVING/INCOME.
           // Source (Primary) must now become generic "Transfer Out", Destination (Linked) becomes user's category.
           let expenseType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
           if (!expenseType) expenseType = await prisma.transactionType.findFirst({ where: { behavior: 'EXPENSE' }});

           let transferOutCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
           if (!transferOutCat) transferOutCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });

           primaryCategoryId = transferOutCat.id;
           primaryTypeId = expenseType!.id;

           linkedCategoryId = categoryId;
           linkedTypeId = typeId;
        }
      } else {
        // --- WE ARE UPDATING THE "TO" LEG (Primary for Income/Investments) ---
        if (isRequestedExpenseLike) {
           // USER CHANGED TYPE FROM INVESTMENT/INCOME TO EXPENSE.
           // Source (Linked) must now become user's category, Destination (Primary) becomes generic "Transfer In".
           let incomeType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'INCOME' }});
           if (!incomeType) incomeType = await prisma.transactionType.findFirst({ where: { behavior: 'INCOME' }});

           let transferInCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนเข้าภายใน' } });
           if (!transferInCat) transferInCat = await prisma.transactionCategory.create({ data: { name: 'โอนเข้าภายใน', organizationId: user.organizationId, typeId: incomeType!.id, isActive: true } });

           primaryCategoryId = transferInCat.id;
           primaryTypeId = incomeType!.id;

           linkedCategoryId = categoryId;
           linkedTypeId = typeId;
        } else {
           primaryCategoryId = categoryId;
           primaryTypeId = typeId;
           
           // Source stays/becomes generic "Transfer Out"
           let expenseType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
           if (!expenseType) expenseType = await prisma.transactionType.findFirst({ where: { behavior: 'EXPENSE' }});

           let transferOutCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
           if (!transferOutCat) transferOutCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });
           
           linkedCategoryId = transferOutCat.id;
           linkedTypeId = expenseType!.id;
        }
      }
    }

    let targetPrimaryAccountId = body.accountId;
    if (!isTransferIntent && !targetPrimaryAccountId) {
       targetPrimaryAccountId = body.toAccountId || body.fromAccountId || existing.accountId;
    }

    if (isTransferIntent) {
      if (wasTransfer) {
        targetPrimaryAccountId = isExistingExpense ? body.fromAccountId : body.toAccountId;
      } else {
        // Converting to transfer. The primary leg is the one that already existed.
        targetPrimaryAccountId = existing.accountId;
      }
    } 
    
    let assetId: string | null = null;
    let liabilityId: string | null = null;
    const account = await prisma.account.findUnique({ where: { id: targetPrimaryAccountId as string } });
    if (account) {
      if (account.type === 'LIABILITY') {
        const l = await prisma.liability.findUnique({ where: { accountId: targetPrimaryAccountId as string } });
        liabilityId = l?.id || null;
      } else {
        const a = await prisma.asset.findUnique({ where: { accountId: targetPrimaryAccountId as string } });
        assetId = a?.id || null;
      }
    }

    // Reverse old balances
    await adjustAccountBalance(existing.accountId, existing.amount, existing.typeId, true);
    if (linked) {
      await adjustAccountBalance(linked.accountId, linked.amount, linked.typeId, true);
    }

    const updatedPrimary = await prisma.transaction.update({
      where: { id },
      data: {
        accountId: targetPrimaryAccountId as string,
        categoryId: primaryCategoryId,
        amount: body.amount,
        description: body.description !== undefined ? body.description : existing.description,
        note: body.note !== undefined ? body.note : existing.note,
        typeId: primaryTypeId,
        assetId,
        liabilityId,
        date: body.date ? new Date(body.date) : existing.date,
        actualDate: body.actualDate !== undefined ? (body.actualDate ? new Date(body.actualDate) : null) : existing.actualDate,
        linkedTransactionId: (wasTransfer && !isTransferIntent) ? null : existing.linkedTransactionId,
        direction: !isTransferIntent ? body.direction : (isExistingExpense ? 'FROM' : 'TO')
      },
      include: {
        account: { include: { bank: { select: { name: true, color: true } } } },
        asset: true,
        liability: true,
        category: { include: { type: true } },
        type: true
      }
    });

    if (isTransferIntent && !wasTransfer) {
      console.log('[DEBUG-UPDATE] CONVERSION: Single -> Transfer');
      // CONVERSION: Single -> Transfer
      let targetLinkedAccountId = isExistingExpense ? body.toAccountId : body.fromAccountId;
      if (!targetLinkedAccountId) throw new Error("Missing linked account ID for transfer conversion");

      let linkedAssetId: string | null = null;
      let linkedLiabilityId: string | null = null;
      const linkedAccount = await prisma.account.findUnique({ where: { id: targetLinkedAccountId } });
      if (linkedAccount) {
        if (linkedAccount.type === 'LIABILITY') {
          const l = await prisma.liability.findUnique({ where: { accountId: targetLinkedAccountId } });
          linkedLiabilityId = l?.id || null;
        } else {
          const a = await prisma.asset.findUnique({ where: { accountId: targetLinkedAccountId } });
          linkedAssetId = a?.id || null;
        }
      }

      let newLegTypeId: string;
      let newLegCategoryId: string;

      if (isExistingExpense) {
        // Primary is From. New leg is To (Income/Investment).
        const isRequestedExpenseLike = ['EXPENSE', 'DEBT'].includes(categoryBehavior);

        if (isRequestedExpenseLike) {
           // Source stays Expense. Dest gets Transfer In.
           let incomeType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'INCOME' }});
           let transferInCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนเข้าภายใน' } });
           if (!transferInCat) transferInCat = await prisma.transactionCategory.create({ data: { name: 'โอนเข้าภายใน', organizationId: user.organizationId, typeId: incomeType!.id, isActive: true } });
           
           newLegTypeId = incomeType!.id;
           newLegCategoryId = transferInCat.id;
           
           primaryCategoryId = categoryId;
           primaryTypeId = typeId;
        } else {
           // Source becomes Transfer Out. Dest gets Investment.
           let expenseType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE', name: 'รายจ่าย' }}) || await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
           let transferOutCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
           if (!transferOutCat) transferOutCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });

           primaryCategoryId = transferOutCat.id;
           primaryTypeId = expenseType!.id;

           newLegCategoryId = categoryId;
           newLegTypeId = typeId;
        }
      } else {
        // Primary is To. New leg is From (Expense/Transfer Out).
        // Similar logic, but typically users don't start from the To leg unless it's a specific scenario.
        // We will default to standard Investment flow: Source = Transfer Out, Dest = Investment.
        let expenseType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE', name: 'รายจ่าย' }}) || await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
        let transferOutCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
        if (!transferOutCat) transferOutCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });
        
        newLegTypeId = expenseType!.id;
        newLegCategoryId = transferOutCat.id;
      }

      const newLeg = await prisma.transaction.create({
        data: {
          accountId: targetLinkedAccountId,
          categoryId: newLegCategoryId,
          typeId: newLegTypeId,
          userId: user.sub,
          organizationId: user.organizationId,
          amount: updatedPrimary.amount,
          description: updatedPrimary.description,
          note: updatedPrimary.note,
          date: updatedPrimary.date,
          actualDate: updatedPrimary.actualDate,
          assetId: linkedAssetId,
          liabilityId: linkedLiabilityId,
          linkedTransactionId: updatedPrimary.id,
          direction: isExistingExpense ? 'TO' : 'FROM'
        }
      });

      await prisma.transaction.update({
        where: { id: updatedPrimary.id },
        data: { linkedTransactionId: newLeg.id }
      });

      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId);
      await adjustAccountBalance(newLeg.accountId, newLeg.amount, newLeg.typeId);

    } else if (wasTransfer && !isTransferIntent) {
      // CONVERSION: Transfer -> Single
      await prisma.transaction.delete({ where: { id: linked!.id } });
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId);

    } else if (wasTransfer && isTransferIntent) {
      // STANDARD: Update Transfer
      const targetLinkedAccountId = (isExistingExpense ? body.toAccountId : body.fromAccountId) || linked!.accountId;
      
      let linkedAssetId: string | null = null;
      let linkedLiabilityId: string | null = null;
      const linkedAccount = await prisma.account.findUnique({ where: { id: targetLinkedAccountId } });
      if (linkedAccount) {
        if (linkedAccount.type === 'LIABILITY') {
          const l = await prisma.liability.findUnique({ where: { accountId: targetLinkedAccountId } });
          linkedLiabilityId = l?.id || null;
        } else {
          const a = await prisma.asset.findUnique({ where: { accountId: targetLinkedAccountId } });
          linkedAssetId = a?.id || null;
        }
      }

      await prisma.transaction.update({
        where: { id: linked!.id },
        data: { 
          accountId: targetLinkedAccountId,
          amount: updatedPrimary.amount, 
          date: updatedPrimary.date, 
          actualDate: updatedPrimary.actualDate,
          description: updatedPrimary.description,
          assetId: linkedAssetId,
          liabilityId: linkedLiabilityId,
          categoryId: linkedCategoryId !== undefined ? linkedCategoryId : linked!.categoryId,
          typeId: linkedTypeId !== undefined ? linkedTypeId : linked!.typeId,
          direction: isExistingExpense ? 'TO' : 'FROM'
        }
      });
      
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId);
      await adjustAccountBalance(targetLinkedAccountId, updatedPrimary.amount, linked!.typeId);
    } else {
      // STANDARD: Update Single
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId);
    }

    return reply.send({ message: 'Transaction updated (v2)', transaction: updatedPrimary });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Transaction not found or unauthorized' });
    }

    await prisma.transaction.delete({ where: { id } });
    await adjustAccountBalance(existing.accountId, existing.amount, existing.typeId, true);

    if (existing.linkedTransactionId) {
      const linked = await prisma.transaction.findUnique({ where: { id: existing.linkedTransactionId } });
      if (linked) {
         await prisma.transaction.delete({ where: { id: linked.id } });
         await adjustAccountBalance(linked.accountId, linked.amount, linked.typeId, true);
      }
    }

    return reply.send({ message: 'Transaction deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const bulkCreateTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const bulkSchema = z.array(transactionSchema);
    const body = bulkSchema.parse(request.body);

    const createdTransactions = [];
    
    // We process them sequentially to avoid race conditions on balances
    for (const item of body) {
        item.amount = Math.abs(item.amount);
        let baseTypeId = item.typeId;
        if (!baseTypeId) {
          const category = await prisma.transactionCategory.findUnique({ where: { id: item.categoryId } });
          if (!category) continue;
          baseTypeId = category.typeId;
        }

        const targetAccId = item.accountId || item.fromAccountId || item.toAccountId;
        if (!targetAccId) continue;

        const account = await prisma.account.findUnique({ where: { id: targetAccId } });
        if (!account) continue;
        
        let assetId: string | null = null;
        let liabilityId: string | null = null;

        if (account.type === 'LIABILITY') {
          const liability = await prisma.liability.findUnique({ where: { accountId: targetAccId } });
          liabilityId = liability?.id || null;
        } else {
          const asset = await prisma.asset.findUnique({ where: { accountId: targetAccId } });
          assetId = asset?.id || null;
        }

        const transaction = await prisma.transaction.create({
          data: {
            accountId: targetAccId,
            categoryId: item.categoryId,
            typeId: baseTypeId as string,
            amount: item.amount,
            description: item.description,
            note: item.note,
            userId: user.sub,
            organizationId: user.organizationId,
            assetId,
            liabilityId,
            date: item.date ? new Date(item.date) : new Date(),
            actualDate: item.actualDate ? new Date(item.actualDate) : null,
          }
        });

        await adjustAccountBalance(transaction.accountId, transaction.amount, transaction.typeId);
        createdTransactions.push(transaction);
    }

    return reply.status(201).send({ message: `${createdTransactions.length} transactions imported successfully`, transactions: createdTransactions });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
