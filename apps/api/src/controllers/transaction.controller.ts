import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { validateTransactionDate } from '../lib/utils';

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
  taxAmount: z.number().optional().nullable(),
  taxType: z.string().optional().nullable(),
  transactionType: z.string().optional().nullable(),
});

export const adjustAccountBalance = async (accountId: string, amount: number, typeId: string, direction: string | null = null, isRemoval: boolean = false, tx?: any) => {
  const db = tx || prisma;
  const [account, type] = await Promise.all([
    db.account.findUnique({ where: { id: accountId } }),
    db.transactionType.findUnique({ where: { id: typeId } })
  ]);
  
  if (!account || !type) return;

  const behavior = type.behavior;
  const isLiability = account.type === 'LIABILITY';
  let multiplier = 0;

  // NEW LOGIC: Priority to Direction
  if (direction === 'TO') {
    multiplier = isLiability ? -1 : 1; // TO Liability = Decrease Debt, TO Asset = Increase Balance
  } else if (direction === 'FROM') {
    multiplier = isLiability ? 1 : -1; // FROM Liability = Increase Debt, FROM Asset = Decrease Balance
  } else {
    // FALLBACK: Old behavior-based logic for legacy transactions without direction
    if (isLiability) {
      if (['EXPENSE', 'DEBT', 'LOAN_BORROW'].includes(behavior)) {
        multiplier = 1;
      } else if (['INCOME', 'LOAN_REPAY', 'INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT'].includes(behavior)) {
        multiplier = -1;
      }
    } else {
      if (['INCOME', 'SAVING', 'INVESTMENT', 'GOAL_SAVING', 'INTERNAL_TRANSFER', 'LOAN_BORROW'].includes(behavior)) {
        multiplier = 1;
      } else if (['EXPENSE', 'DEBT', 'LOAN_REPAY'].includes(behavior)) {
        multiplier = -1;
      }
    }
  }

  const finalAdjustment = isRemoval ? -(amount * multiplier) : (amount * multiplier);

  if (isLiability) {
    await db.liability.upsert({
      where: { accountId },
      update: { amount: { increment: finalAdjustment } },
      create: { accountId, amount: finalAdjustment, userId: account.userId, organizationId: account.organizationId }
    });
  } else {
    await db.asset.upsert({
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

    // Date Sanitization
    const dateVal = validateTransactionDate(body.date);
    if (!dateVal.isValid) return reply.status(400).send({ error: dateVal.error });
    const actualDateVal = validateTransactionDate(body.actualDate);
    if (!actualDateVal.isValid) return reply.status(400).send({ error: actualDateVal.error });

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
    
    // Explicit direction from body or determined by behavior for single-leg transactions
    let direction = body.direction;
    if (!isTransfer && !direction) {
        const behavior = category.type.behavior;
        const catName = category.name.toLowerCase();
        
        // Correct Logic:
        // Outbound (From): Expense, Debt, Loan Repay, Saving, Investment
        // Inbound (To): Income, Loan Borrow
        const isOutbound = ['EXPENSE', 'DEBT', 'LOAN_REPAY', 'SAVING', 'INVESTMENT'].includes(behavior) || 
                          catName.includes('ออก') || catName.includes('คืน');
        const isInbound = ['INCOME', 'LOAN_BORROW'].includes(behavior) || 
                          catName.includes('เข้า') || catName.includes('ยืม') || catName.includes('กู้');
        
        if (isOutbound && !isInbound) {
            direction = 'FROM';
        } else if (isInbound && !isOutbound) {
            direction = 'TO';
        } else {
            // Default to FROM for single account if still ambiguous (most common)
            direction = 'FROM';
        }
    }

    const processSingleLeg = async (tx: any, accId: string, catId: string, tId: string, linkedId: string | null, legDirection: string | null = null) => {
        const account = await tx.account.findFirst({ 
          where: { 
            id: accId,
            organizationId: user.organizationId // IDOR Protection
          } 
        });
        if (!account) throw new Error('Account not found or unauthorized');
        
        let assetId: string | null = null;
        let liabilityId: string | null = null;

        if (account.type === 'LIABILITY') {
          const liability = await tx.liability.findUnique({ where: { accountId: accId } });
          liabilityId = liability?.id || null;
        } else {
          const asset = await tx.asset.findUnique({ where: { accountId: accId } });
          assetId = asset?.id || null;
        }

        const transaction = await tx.transaction.create({
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
            taxAmount: commonData.taxAmount || 0,
            taxType: commonData.taxType || 'NONE',
            transactionType: commonData.transactionType || (legDirection === 'FROM' ? 'EXPENSE' : 'INCOME'),
          },
          include: {
            account: { include: { bank: { select: { name: true, color: true } } } },
            asset: true,
            liability: true,
            category: { include: { type: true } },
            type: true
          }
        });

        await adjustAccountBalance(transaction.accountId, transaction.amount, transaction.typeId, transaction.direction, false, tx);
        return transaction;
    };

    const syncLoanRecord = async (tx: any, tRecord: any) => {
        const behavior = tRecord.category?.type?.behavior || tRecord.type?.behavior;
        
        if (behavior === 'LOAN_BORROW') {
            const loanData = {
                organizationId: tRecord.organizationId,
                userId: tRecord.userId,
                accountId: tRecord.accountId,
                name: tRecord.description || 'Loan from ' + (tRecord.account?.name || 'Account'),
                totalAmount: tRecord.amount,
                status: 'ACTIVE',
                date: tRecord.date,
                actualDate: tRecord.actualDate || tRecord.date,
            };

            let loan;
            if (tRecord.loanId) {
                loan = await tx.loan.update({
                    where: { id: tRecord.loanId },
                    data: loanData
                });
            } else {
                loan = await tx.loan.create({
                    data: {
                        ...loanData,
                        code: 'L' + Math.floor(1000 + Math.random() * 9000)
                    }
                });
                
                await tx.transaction.update({
                    where: { id: tRecord.id },
                    data: { loanId: loan.id }
                });

                if (tRecord.linkedTransactionId) {
                    await tx.transaction.update({
                        where: { id: tRecord.linkedTransactionId },
                        data: { loanId: loan.id }
                    });
                }
            }
            return loan;
        } else if (tRecord.loanId) {
            const oldLoanId = tRecord.loanId;
            await tx.transaction.updateMany({
                where: { loanId: oldLoanId },
                data: { loanId: null }
            });
            await tx.loan.delete({ where: { id: oldLoanId } });
        }
        return null;
    };

    const baseTypeId = category.typeId;

    const result = await prisma.$transaction(async (tx) => {
        if (isTransfer) {
            const toAccount = await tx.account.findUnique({ where: { id: toAccountId as string } });
            let behaviorToUse = category.type.behavior;
            
            if (toAccount && !toAccount.isPersonal && behaviorToUse !== 'INVESTMENT') {
                behaviorToUse = 'EXPENSE';
            }

            const isRequestedExpenseLike = ['EXPENSE', 'DEBT'].includes(behaviorToUse);
            
            if (isRequestedExpenseLike) {
                const sourceTx = await processSingleLeg(tx, fromAccountId as string, body.categoryId, baseTypeId as string, null, 'FROM');
                
                let incomeType = await tx.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'INCOME' }});
                if (!incomeType) incomeType = await tx.transactionType.findFirst({ where: { behavior: 'INCOME' }});
                
                let transferInCat = await tx.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนเข้าภายใน' } });
                if (!transferInCat) {
                    transferInCat = await tx.transactionCategory.create({ data: { name: 'โอนเข้าภายใน', organizationId: user.organizationId, typeId: incomeType!.id, isActive: true } });
                }
                
                const destTx = await processSingleLeg(tx, toAccountId as string, transferInCat.id, incomeType!.id, sourceTx.id, 'TO');
                
                const finalSourceTx = await tx.transaction.update({
                   where: { id: sourceTx.id },
                   data: { linkedTransactionId: destTx.id },
                   include: { category: { include: { type: true } }, account: true, type: true }
                });
     
                await syncLoanRecord(tx, finalSourceTx);
                return { type: 'EXPENSE_TRANSFER', transaction: finalSourceTx };
            } else {
                const destTx = await processSingleLeg(tx, toAccountId as string, body.categoryId, baseTypeId as string, null, 'TO');
                
                let expenseType = await tx.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
                if (!expenseType) expenseType = await tx.transactionType.findFirst({ where: { behavior: 'EXPENSE' }});
                
                let transferOutCat = await tx.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
                if (!transferOutCat) {
                    transferOutCat = await tx.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });
                }
     
                const sourceTx = await processSingleLeg(tx, fromAccountId as string, transferOutCat.id, expenseType!.id, destTx.id, 'FROM');
                
                const finalDestTx = await tx.transaction.update({
                   where: { id: destTx.id },
                   data: { linkedTransactionId: sourceTx.id },
                   include: { category: { include: { type: true } }, account: true, type: true }
                });
    
                if (category.type.behavior === 'LOAN_BORROW') {
                    const sourceWithCat = { ...sourceTx, category: category, loanId: null };
                    await syncLoanRecord(tx, sourceWithCat);
                } else {
                    await syncLoanRecord(tx, finalDestTx);
                }
    
                return { type: 'TRANSFER', transaction: finalDestTx };
            }
        } else {
            const targetAccId = accountId || fromAccountId || toAccountId;
            if (!targetAccId) throw new Error('No account selected');

            const txRecord = await processSingleLeg(tx, targetAccId, body.categoryId, baseTypeId as string, null, direction);
            await syncLoanRecord(tx, txRecord);
            return { type: 'SINGLE', transaction: txRecord };
        }
    });

    if (result.type === 'EXPENSE_TRANSFER') {
        return reply.status(201).send({ message: 'Expense transfer created successfully', transaction: result.transaction });
    } else if (result.type === 'TRANSFER') {
        return reply.status(201).send({ message: 'Transfer created successfully', transaction: result.transaction });
    } else {
        return reply.status(201).send({ message: 'Transaction created', transaction: result.transaction });
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
    let { 
      accountId: reqAccountId, fromAccountId, toAccountId, categoryId, typeId, 
      amount, description, date, actualDate, note, direction 
    } = body;

    // Date Sanitization
    const dateVal = validateTransactionDate(date);
    if (!dateVal.isValid) return reply.status(400).send({ error: dateVal.error });
    const actualDateVal = validateTransactionDate(actualDate);
    if (!actualDateVal.isValid) return reply.status(400).send({ error: actualDateVal.error });

    amount = Math.abs(amount);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Transaction not found or unauthorized' });
    }

    const category = await prisma.transactionCategory.findFirst({ 
      where: { 
        id: categoryId,
        organizationId: user.organizationId // IDOR Protection
      }, 
      include: { type: true } 
    });
    if (!category) return reply.status(404).send({ error: 'Category not found or unauthorized' });
    
    typeId = typeId || category.typeId;
    const categoryBehavior = category.type.behavior;

    // Sync linked transaction
    const linked = existing.linkedTransactionId 
      ? await prisma.transaction.findUnique({ where: { id: existing.linkedTransactionId } }) 
      : null;

    const existingType = await prisma.transactionType.findUnique({ where: { id: existing.typeId } });
    const behavior = existingType?.behavior;
    const isExistingExpense = behavior === 'EXPENSE' || behavior === 'DEBT';
    
    const isTransferIntent = !!(fromAccountId && toAccountId) && (
      ['INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL_SAVING', 'DEBT', 'EXPENSE', 'INCOME'].includes(categoryBehavior)
    );
    const wasTransfer = !!existing.linkedTransactionId;
    console.log('[DEBUG-UPDATE] id:', existing.id);
    console.log('[DEBUG-UPDATE] fromAccountId:', fromAccountId, 'toAccountId:', toAccountId);
    console.log('[DEBUG-UPDATE] categoryBehavior:', categoryBehavior);
    console.log('[DEBUG-UPDATE] isTransferIntent:', isTransferIntent, 'wasTransfer:', wasTransfer);

    // --- Category Routing for Transfers ---
    let primaryCategoryId: string = categoryId;
    let primaryTypeId: string = (typeId as string);
    let linkedCategoryId: string | undefined = undefined;
    let linkedTypeId: string | undefined = undefined;

    if (wasTransfer && isTransferIntent) {
      let behaviorToUse = categoryBehavior;
      const targetToAccountId = toAccountId || (isExistingExpense ? linked!.accountId : existing.accountId);
      
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

    let targetPrimaryAccountId = reqAccountId || (isExistingExpense ? fromAccountId : toAccountId) || toAccountId || fromAccountId || existing.accountId;
    
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

    const result = await prisma.$transaction(async (tx) => {
        // Reverse old balances using transaction client
        await adjustAccountBalance(existing.accountId, existing.amount, existing.typeId, existing.direction, true, tx);
        if (linked) {
          await adjustAccountBalance(linked.accountId, linked.amount, linked.typeId, linked.direction, true, tx);
        }

        const updatedPrimary = await tx.transaction.update({
          where: { id },
          data: {
            accountId: targetPrimaryAccountId as string,
            categoryId: primaryCategoryId,
            amount: amount,
            description: description || undefined,
            note: note || undefined,
            typeId: primaryTypeId,
            assetId: assetId || undefined,
            liabilityId: liabilityId || undefined,
            date: date ? new Date(date) : (existing.date as Date),
            actualDate: actualDate !== undefined ? (actualDate ? new Date(actualDate) : null) : existing.actualDate,
            linkedTransactionId: (wasTransfer && !isTransferIntent) ? null : existing.linkedTransactionId,
            direction: (direction as string) || (!isTransferIntent ? (['EXPENSE', 'DEBT', 'LOAN_REPAY', 'INTERNAL_TRANSFER'].includes(behavior || '') ? 'FROM' : 'TO') : (isExistingExpense ? 'FROM' : 'TO')),
            taxAmount: body.taxAmount !== undefined ? body.taxAmount : existing.taxAmount,
            taxType: body.taxType !== undefined ? body.taxType : existing.taxType,
            transactionType: body.transactionType !== undefined ? body.transactionType : existing.transactionType,
          },
          include: {
            account: { include: { bank: { select: { name: true, color: true } } } },
            asset: true,
            liability: true,
            category: { include: { type: true } },
            type: true
          }
        });

    const syncLoanRecordUpdate = async (tx: any, tRecord: any) => {
        const behavior = tRecord.category?.type?.behavior || tRecord.type?.behavior;
        if (behavior === 'LOAN_BORROW') {
            const loanData = {
                organizationId: tRecord.organizationId,
                userId: tRecord.userId,
                accountId: tRecord.accountId,
                name: tRecord.description || 'Loan from ' + (tRecord.account?.name || 'Account'),
                totalAmount: tRecord.amount,
                date: tRecord.date,
                actualDate: tRecord.actualDate || tRecord.date,
            };

            if (tRecord.loanId) {
                await tx.loan.update({ where: { id: tRecord.loanId }, data: loanData });
            } else {
                const loan = await tx.loan.create({
                    data: { ...loanData, status: 'ACTIVE', code: 'L' + Math.floor(1000 + Math.random() * 9000) }
                });
                await tx.transaction.update({ where: { id: tRecord.id }, data: { loanId: loan.id } });
                if (tRecord.linkedTransactionId) {
                    await tx.transaction.update({ where: { id: tRecord.linkedTransactionId }, data: { loanId: loan.id } });
                }
            }
        } else if (tRecord.loanId) {
            const oldLoanId = tRecord.loanId;
            await tx.transaction.updateMany({ where: { loanId: oldLoanId }, data: { loanId: null } });
            await tx.loan.delete({ where: { id: oldLoanId } });
        }
    };

    if (isTransferIntent && !wasTransfer) {
      console.log('[DEBUG-UPDATE] CONVERSION: Single -> Transfer');
      let targetLinkedAccountId = isExistingExpense ? toAccountId : fromAccountId;
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
        const isRequestedExpenseLike = ['EXPENSE', 'DEBT'].includes(categoryBehavior);
        if (isRequestedExpenseLike) {
           let incomeType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'INCOME' }});
           let transferInCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนเข้าภายใน' } });
           if (!transferInCat) transferInCat = await prisma.transactionCategory.create({ data: { name: 'โอนเข้าภายใน', organizationId: user.organizationId, typeId: incomeType!.id, isActive: true } });
           newLegTypeId = incomeType!.id;
           newLegCategoryId = transferInCat.id;
        } else {
           let expenseType = await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE', name: 'รายจ่าย' }}) || await prisma.transactionType.findFirst({ where: { organizationId: user.organizationId, behavior: 'EXPENSE' }});
           let transferOutCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.organizationId, name: 'โอนออกภายใน' } });
           if (!transferOutCat) transferOutCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.organizationId, typeId: expenseType!.id, isActive: true } });
           newLegCategoryId = categoryId;
           newLegTypeId = typeId;
        }
      } else {
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

      const finalUpdatedPrimary = await prisma.transaction.update({
        where: { id: updatedPrimary.id },
        data: { linkedTransactionId: newLeg.id },
        include: { category: { include: { type: true } }, account: true, type: true }
      });

      await adjustAccountBalance(finalUpdatedPrimary.accountId, finalUpdatedPrimary.amount, finalUpdatedPrimary.typeId, finalUpdatedPrimary.direction);
      await adjustAccountBalance(newLeg.accountId, newLeg.amount, newLeg.typeId, newLeg.direction);
      await syncLoanRecordUpdate(finalUpdatedPrimary);

    } else if (wasTransfer && !isTransferIntent) {
      await prisma.transaction.delete({ where: { id: linked!.id } });
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId, updatedPrimary.direction);
      await syncLoanRecordUpdate(updatedPrimary);

    } else if (wasTransfer && isTransferIntent) {
      const targetLinkedAccountId = (isExistingExpense ? toAccountId : fromAccountId) || linked!.accountId;
      
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

      const updatedLinked = await prisma.transaction.update({
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
      
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId, updatedPrimary.direction, false, tx);
      await adjustAccountBalance(targetLinkedAccountId, updatedPrimary.amount, updatedLinked.typeId, updatedLinked.direction, false, tx);
      await syncLoanRecordUpdate(tx, updatedPrimary);
    } else {
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId, updatedPrimary.direction, false, tx);
      await syncLoanRecordUpdate(tx, updatedPrimary);
    }
    return updatedPrimary;
    });

    return reply.send({ message: 'Transaction updated (v2)', transaction: result });
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

    await prisma.$transaction(async (tx) => {
      if (existing.loanId) {
          const oldLoanId = existing.loanId;
          await tx.transaction.updateMany({ where: { loanId: oldLoanId }, data: { loanId: null } });
          await tx.loan.delete({ where: { id: oldLoanId } });
      }

      await tx.transaction.delete({ where: { id } });
      await adjustAccountBalance(existing.accountId, existing.amount, existing.typeId, existing.direction, true, tx);
   
      if (existing.linkedTransactionId) {
        const linked = await tx.transaction.findUnique({ where: { id: existing.linkedTransactionId } });
        if (linked) {
           await tx.transaction.delete({ where: { id: linked.id } });
           await adjustAccountBalance(linked.accountId, linked.amount, linked.typeId, linked.direction, true, tx);
        }
      }
    });

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

    const result = await prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      
      for (let i = 0; i < body.length; i++) {
        const item = body[i];
        const rowIndex = i + 1;

        // 1. Date Sanitization
        const dateVal = validateTransactionDate(item.date);
        if (!dateVal.isValid) throw new Error(`Row ${rowIndex}: ${dateVal.error}`);
        const actualDateVal = validateTransactionDate(item.actualDate);
        if (!actualDateVal.isValid) throw new Error(`Row ${rowIndex}: ${actualDateVal.error}`);

        item.amount = Math.abs(item.amount);
        let baseTypeId = item.typeId;
        
        // 2. Existence Checks (Integrity)
        if (!baseTypeId) {
          const category = await tx.transactionCategory.findUnique({ 
            where: { id: item.categoryId } 
          });
          if (!category) throw new Error(`Row ${rowIndex}: Category ID ${item.categoryId} not found`);
          if (category.organizationId !== user.organizationId) throw new Error(`Row ${rowIndex}: Unauthorized category access`);
          baseTypeId = category.typeId;
        }

        const targetAccId = item.accountId || item.fromAccountId || item.toAccountId;
        if (!targetAccId) throw new Error(`Row ${rowIndex}: No account selected`);

        const account = await tx.account.findUnique({ 
          where: { id: targetAccId } 
        });
        if (!account) throw new Error(`Row ${rowIndex}: Account ID ${targetAccId} not found`);
        if (account.organizationId !== user.organizationId) throw new Error(`Row ${rowIndex}: Unauthorized account access`);
        
        let assetId: string | null = null;
        let liabilityId: string | null = null;

        if (account.type === 'LIABILITY') {
          const liability = await tx.liability.findUnique({ where: { accountId: targetAccId } });
          liabilityId = liability?.id || null;
        } else {
          const asset = await tx.asset.findUnique({ where: { accountId: targetAccId } });
          assetId = asset?.id || null;
        }

        // 3. Create Record
        const transaction = await tx.transaction.create({
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
            date: dateVal.date || new Date(),
            actualDate: actualDateVal.date,
          }
        });

        // 4. Adjust Balance (Must use the transaction-aware helper if available, or inline)
        // Note: adjustAccountBalance currently uses root 'prisma', we need to pass 'tx' or inline it.
        // For strict atomicity, let's inline the logic or refactor adjustAccountBalance.
        
        const type = await tx.transactionType.findUnique({ where: { id: baseTypeId as string } });
        if (!type) throw new Error(`Row ${rowIndex}: Transaction Type not found`);

        const behavior = type.behavior;
        const isLiability = account.type === 'LIABILITY';
        let multiplier = 0;

        // Simplify balance adjustment logic for bulk import (assuming single leg)
        // 4. Adjust Balance using the refactored helper
        const direction = item.direction || 'FROM'; // Default for bulk import if not specified
        await adjustAccountBalance(targetAccId, item.amount, baseTypeId as string, direction, false, tx);

        createdTransactions.push(transaction);
      }
      return createdTransactions;
    });

    return reply.status(201).send({ 
      message: `${result.length} transactions imported successfully`, 
      transactions: result 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(400).send({ error: error.message || 'Internal Server Error' });
  }
};
