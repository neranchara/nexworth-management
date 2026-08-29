import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { validateTransactionDate } from '../lib/utils';
import { SYSTEM_CATEGORY_KEYS, BEHAVIOR_METADATA, getAssetMultiplier } from '../constants/transactionConfig.js';

// Auto-heal helper: lookup system category by systemKey first, fall back to name, then create
async function getSystemCategory(db: any, systemKey: string, fallbackName: string, behavior: string, orgId: string) {
  let cat = await db.transactionCategory.findFirst({
    where: { systemKey, organizationId: orgId },
    include: { type: true }
  });
  if (!cat) {
    cat = await db.transactionCategory.findFirst({
      where: { name: fallbackName, organizationId: orgId, type: { behavior } },
      include: { type: true }
    });
    if (cat) await db.transactionCategory.update({ where: { id: cat.id }, data: { systemKey } });
  }
  if (!cat) {
    let type = await db.transactionType.findFirst({ where: { organizationId: orgId, behavior } });
    if (!type) type = await db.transactionType.findFirst({ where: { behavior } });
    if (type) {
      cat = await db.transactionCategory.create({
        data: { name: fallbackName, organizationId: orgId, typeId: type.id, systemKey, isActive: true },
        include: { type: true }
      });
    }
  }
  return cat;
}

const transactionSchema = z.object({
  accountId: z.string().uuid().optional().nullable(),
  fromAccountId: z.string().uuid().optional().nullable(),
  toAccountId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
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

  // Priority: explicit direction → DB metadata → BEHAVIOR_METADATA fallback
  multiplier = getAssetMultiplier(behavior, isLiability, direction) as 1 | -1 | 0;

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

    // HOOK: Update Goal Allocations (Keep in sync with asset balance as per BA spec)
    const asset = await db.asset.findUnique({ where: { accountId } });
    if (asset) {
      await db.goalAllocation.updateMany({
        where: { assetId: asset.id },
        data: { allocatedAmount: asset.amount }
      });
    }
  }

  // HOOK: Update Monthly Snapshot
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Calculate totals for the user/org
  const [totalAssets, totalLiabilities] = await Promise.all([
    db.asset.aggregate({ _sum: { amount: true }, where: { userId: account.userId } }),
    db.liability.aggregate({ _sum: { amount: true }, where: { userId: account.userId } })
  ]);

  // Calculate monthly income/expense
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const [monthlyIncome, monthlyExpense] = await Promise.all([
    db.transaction.aggregate({ 
      _sum: { amount: true }, 
      where: { 
        userId: account.userId, 
        date: { gte: startOfMonth, lte: endOfMonth },
        type: { behavior: 'INCOME' }
      } 
    }),
    db.transaction.aggregate({ 
      _sum: { amount: true }, 
      where: { 
        userId: account.userId, 
        date: { gte: startOfMonth, lte: endOfMonth },
        type: { behavior: 'EXPENSE' }
      } 
    })
  ]);

  const tInc = monthlyIncome._sum.amount || 0;
  const tExp = monthlyExpense._sum.amount || 0;
  const tAsst = totalAssets._sum.amount || 0;
  const tLiab = totalLiabilities._sum.amount || 0;

  await db.monthlyFinancialSnapshot.upsert({
    where: { userId_monthYear: { userId: account.userId, monthYear } },
    update: {
      totalAssets: tAsst,
      totalLiabilities: tLiab,
      totalIncome: tInc,
      totalExpense: tExp,
      savingsRate: tInc - tExp,
      netWorth: tAsst - tLiab,
      organizationId: account.organizationId
    },
    create: {
      userId: account.userId,
      organizationId: account.organizationId,
      monthYear,
      totalAssets: tAsst,
      totalLiabilities: tLiab,
      totalIncome: tInc,
      totalExpense: tExp,
      savingsRate: tInc - tExp,
      netWorth: tAsst - tLiab
    }
  });
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
    
    // Fallback: If it's a transfer but only accountId + toAccountId is provided
    const effectiveFromId = fromAccountId || (toAccountId ? accountId : null);
    const isTransfer = !!(effectiveFromId && toAccountId);

    let category = null;
    if (isTransfer && !body.categoryId) {
      // For transfers, we find or create a default internal transfer category if not provided
      let transferType = await prisma.transactionType.findFirst({ 
        where: { organizationId: user.organizationId, behavior: 'INTERNAL_TRANSFER' } 
      });
      if (!transferType) transferType = await prisma.transactionType.findFirst({ where: { behavior: 'INTERNAL_TRANSFER' } });
      
      if (transferType) {
        category = await prisma.transactionCategory.findFirst({
          where: { organizationId: user.organizationId, typeId: transferType.id, name: { contains: 'โอน' } },
          include: { type: true }
        });
        if (!category) {
          category = await prisma.transactionCategory.findFirst({
            where: { organizationId: user.organizationId, typeId: transferType.id },
            include: { type: true }
          });
        }
      }
    }

    if (body.categoryId) {
      category = await prisma.transactionCategory.findFirst({ 
        where: { 
          id: body.categoryId,
          organizationId: user.organizationId // IDOR Protection
        }, 
        include: { type: true } 
      });
      if (!category) return reply.status(400).send({ error: 'Category not found or unauthorized' });
    }
    
    // Explicit direction from body or determined by DB metadata for single-leg transactions
    let direction = body.direction;
    if (!isTransfer && !direction && category) {
        const behavior = (category as any).type?.behavior;
        const dbDirection = (category as any).type?.defaultDirection;
        // Use DB direction if available, fallback to BEHAVIOR_METADATA
        const resolvedDir = dbDirection ?? BEHAVIOR_METADATA[behavior]?.defaultDirection ?? 'NEUTRAL';
        if (resolvedDir === 'OUTBOUND') direction = 'FROM';
        else if (resolvedDir === 'INBOUND') direction = 'TO';
        else direction = 'FROM'; // NEUTRAL defaults to FROM
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

    if (!category && !isTransfer) {
        return reply.status(400).send({ error: 'Category is required for non-transfer transactions' });
    }

    const baseTypeId = category?.typeId;

    const result = await prisma.$transaction(async (tx) => {
        if (isTransfer) {
            const toAccount = await tx.account.findUnique({ where: { id: toAccountId as string } });
            let behaviorToUse = category?.type?.behavior || 'INTERNAL_TRANSFER';
            
            if (toAccount && !toAccount.isPersonal && behaviorToUse !== 'INVESTMENT') {
                behaviorToUse = 'EXPENSE';
            }

            const typeMeta = category?.type ? BEHAVIOR_METADATA[behaviorToUse] : null;
            const isRequestedExpenseLike = category?.type?.isExpenseLike ?? typeMeta?.isExpenseLike ?? false;

            // NEX-FEAT-09: paying down a credit card (transfer targeting a LIABILITY account)
            // gets labeled with a dedicated system category instead of the generic transfer categories.
            const isToLiability = toAccount?.type === 'LIABILITY';
            const liabilityPaymentCat = isToLiability
                ? await getSystemCategory(tx, SYSTEM_CATEGORY_KEYS.LIABILITY_PAYMENT_SYS, 'ชำระบัตรเครดิต', 'LIABILITY_PAYMENT', user.organizationId)
                : null;
            if (isToLiability && !liabilityPaymentCat) throw new Error('Cannot find or create LIABILITY_PAYMENT category');

            if (isRequestedExpenseLike) {
                const sourceTx = await processSingleLeg(tx, effectiveFromId as string, category?.id || '', baseTypeId || '', null, 'FROM');

                const transferInCat = liabilityPaymentCat || await getSystemCategory(tx, SYSTEM_CATEGORY_KEYS.TRANSFER_IN, 'โอนเข้าภายใน', 'INCOME', user.organizationId);
                if (!transferInCat) throw new Error('Cannot find or create TRANSFER_IN category');

                const destTx = await processSingleLeg(tx, toAccountId as string, transferInCat.id, transferInCat.typeId, sourceTx.id, 'TO');

                const finalSourceTx = await tx.transaction.update({
                   where: { id: sourceTx.id },
                   data: { linkedTransactionId: destTx.id },
                   include: { category: { include: { type: true } }, account: true, type: true }
                });

                await syncLoanRecord(tx, finalSourceTx);
                return { type: 'EXPENSE_TRANSFER', transaction: finalSourceTx };
            } else {
                const destCategoryId = liabilityPaymentCat?.id || category?.id || '';
                const destTypeId = liabilityPaymentCat?.typeId || baseTypeId || '';
                const destTx = await processSingleLeg(tx, toAccountId as string, destCategoryId, destTypeId, null, 'TO');

                const transferOutCat = await getSystemCategory(tx, SYSTEM_CATEGORY_KEYS.TRANSFER_OUT, 'โอนออกภายใน', 'EXPENSE', user.organizationId);
                if (!transferOutCat) throw new Error('Cannot find or create TRANSFER_OUT category');

                const sourceTx = await processSingleLeg(tx, effectiveFromId as string, transferOutCat.id, transferOutCat.typeId, destTx.id, 'FROM');
                
                const finalDestTx = await tx.transaction.update({
                   where: { id: destTx.id },
                   data: { linkedTransactionId: sourceTx.id },
                   include: { category: { include: { type: true } }, account: true, type: true }
                });
    
                if (category && category.type.behavior === 'LOAN_BORROW') {
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

            const txRecord = await processSingleLeg(tx, targetAccId, body.categoryId!, baseTypeId as string, null, direction);
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
        id: categoryId!,
        organizationId: user.organizationId // IDOR Protection
      }, 
      include: { type: true } 
    });
    if (!category) return reply.status(404).send({ error: 'Category not found or unauthorized' });
    
    typeId = typeId || category.typeId;
    const categoryBehavior = category.type?.behavior;

    // Sync linked transaction
    const linked = existing.linkedTransactionId 
      ? await prisma.transaction.findUnique({ where: { id: existing.linkedTransactionId } }) 
      : null;

    const existingType = await prisma.transactionType.findUnique({ where: { id: existing.typeId } });
    const behavior = existingType?.behavior;
    const isExistingExpense = (existingType?.isExpenseLike) ?? (behavior === 'EXPENSE' || behavior === 'DEBT');

    const isTransferIntent = !!(fromAccountId && toAccountId) && !!(categoryBehavior);
    const wasTransfer = !!existing.linkedTransactionId;
    console.log('[DEBUG-UPDATE] id:', existing.id);
    console.log('[DEBUG-UPDATE] fromAccountId:', fromAccountId, 'toAccountId:', toAccountId);
    console.log('[DEBUG-UPDATE] categoryBehavior:', categoryBehavior);
    console.log('[DEBUG-UPDATE] isTransferIntent:', isTransferIntent, 'wasTransfer:', wasTransfer);

    // --- Category Routing for Transfers ---
    let primaryCategoryId: string = categoryId!;
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

      const catTypeMeta = categoryBehavior ? BEHAVIOR_METADATA[categoryBehavior] : null;
      const isRequestedExpenseLike = category?.type?.isExpenseLike ?? catTypeMeta?.isExpenseLike ?? false;

      if (isExistingExpense) {
        // --- WE ARE UPDATING THE "FROM" LEG (Primary for Expenses) ---
        if (isRequestedExpenseLike) {
           primaryCategoryId = categoryId!;
           primaryTypeId = typeId!;
           const transferInCat = await getSystemCategory(prisma, SYSTEM_CATEGORY_KEYS.TRANSFER_IN, 'โอนเข้าภายใน', 'INCOME', user.organizationId);
           if (!transferInCat) throw new Error('Cannot find or create TRANSFER_IN category');
           linkedCategoryId = transferInCat.id;
           linkedTypeId = transferInCat.typeId;
        } else {
           // USER CHANGED TYPE FROM EXPENSE TO INVESTMENT/SAVING/INCOME.
           const transferOutCat = await getSystemCategory(prisma, SYSTEM_CATEGORY_KEYS.TRANSFER_OUT, 'โอนออกภายใน', 'EXPENSE', user.organizationId);
           if (!transferOutCat) throw new Error('Cannot find or create TRANSFER_OUT category');
           primaryCategoryId = transferOutCat.id;
           primaryTypeId = transferOutCat.typeId;
           linkedCategoryId = categoryId || undefined;
           linkedTypeId = typeId || undefined;
        }
      } else {
        // --- WE ARE UPDATING THE "TO" LEG (Primary for Income/Investments) ---
        if (isRequestedExpenseLike) {
           // USER CHANGED TYPE FROM INVESTMENT/INCOME TO EXPENSE.
           const transferInCat = await getSystemCategory(prisma, SYSTEM_CATEGORY_KEYS.TRANSFER_IN, 'โอนเข้าภายใน', 'INCOME', user.organizationId);
           if (!transferInCat) throw new Error('Cannot find or create TRANSFER_IN category');
           primaryCategoryId = transferInCat.id;
           primaryTypeId = transferInCat.typeId;
           linkedCategoryId = categoryId || undefined;
           linkedTypeId = typeId || undefined;
        } else {
           primaryCategoryId = categoryId!;
           primaryTypeId = typeId!;
           const transferOutCat = await getSystemCategory(prisma, SYSTEM_CATEGORY_KEYS.TRANSFER_OUT, 'โอนออกภายใน', 'EXPENSE', user.organizationId);
           if (!transferOutCat) throw new Error('Cannot find or create TRANSFER_OUT category');
           linkedCategoryId = transferOutCat.id;
           linkedTypeId = transferOutCat.typeId;
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
            direction: (direction as string) || (!isTransferIntent ? ((existingType?.defaultDirection ?? BEHAVIOR_METADATA[behavior || '']?.defaultDirection) === 'OUTBOUND' ? 'FROM' : 'TO') : (isExistingExpense ? 'FROM' : 'TO')),
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

      const catMeta = categoryBehavior ? BEHAVIOR_METADATA[categoryBehavior] : null;
      const isReqExpenseLike = category?.type?.isExpenseLike ?? catMeta?.isExpenseLike ?? false;

      if (isExistingExpense) {
        if (isReqExpenseLike) {
          const transferInCat = await getSystemCategory(prisma, SYSTEM_CATEGORY_KEYS.TRANSFER_IN, 'โอนเข้าภายใน', 'INCOME', user.organizationId);
          if (!transferInCat) throw new Error('Cannot find or create TRANSFER_IN category');
          newLegTypeId = transferInCat.typeId;
          newLegCategoryId = transferInCat.id;
        } else {
          newLegCategoryId = categoryId!;
          newLegTypeId = typeId!;
        }
      } else {
        const transferOutCat = await getSystemCategory(prisma, SYSTEM_CATEGORY_KEYS.TRANSFER_OUT, 'โอนออกภายใน', 'EXPENSE', user.organizationId);
        if (!transferOutCat) throw new Error('Cannot find or create TRANSFER_OUT category');
        newLegTypeId = transferOutCat.typeId;
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

      await adjustAccountBalance(finalUpdatedPrimary.accountId, finalUpdatedPrimary.amount, finalUpdatedPrimary.typeId, finalUpdatedPrimary.direction, false, tx);
      await adjustAccountBalance(newLeg.accountId, newLeg.amount, newLeg.typeId, newLeg.direction, false, tx);
      await syncLoanRecordUpdate(tx, finalUpdatedPrimary);

    } else if (wasTransfer && !isTransferIntent) {
      await prisma.transaction.delete({ where: { id: linked!.id } });
      await adjustAccountBalance(updatedPrimary.accountId, updatedPrimary.amount, updatedPrimary.typeId, updatedPrimary.direction, false, tx);
      await syncLoanRecordUpdate(tx, updatedPrimary);

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
        if (!item.categoryId) throw new Error(`Row ${rowIndex}: Category ID is required`);
        
        if (!baseTypeId) {
          const category = await tx.transactionCategory.findUnique({ 
            where: { id: item.categoryId! } 
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
