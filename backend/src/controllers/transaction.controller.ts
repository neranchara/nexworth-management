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
});

const adjustAccountBalance = async (accountId: string, amount: number, typeId: string, isRemoval: boolean = false) => {
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
    const user = request.user as { sub: string, orgId: string };
    const { month, year } = request.query as { month?: string; year?: string };

    let whereClause: any = { organizationId: user.orgId };

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
    return reply.send({ transactions });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, orgId: string };
    const body = transactionSchema.parse(request.body);

    if (!body.accountId && !body.fromAccountId && !body.toAccountId) {
      return reply.status(400).send({ error: 'At least one account must be selected' });
    }

    body.amount = Math.abs(body.amount);

    let baseTypeId = body.typeId;
    if (!baseTypeId) {
      const category = await prisma.transactionCategory.findUnique({ where: { id: body.categoryId } });
      if (!category) return reply.status(400).send({ error: 'Category not found' });
      baseTypeId = category.typeId;
    }

    const { accountId, fromAccountId, toAccountId, ...commonData } = body;
    const isTransfer = fromAccountId && toAccountId;

    const processSingleLeg = async (accId: string, catId: string, tId: string, linkedId: string | null) => {
        const account = await prisma.account.findUnique({ where: { id: accId } });
        if (!account) throw new Error('Account not found');
        
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
            organizationId: user.orgId,
            assetId,
            liabilityId,
            linkedTransactionId: linkedId,
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

    if (isTransfer) {
        const destTx = await processSingleLeg(toAccountId, body.categoryId, baseTypeId as string, null);
        
        let type = await prisma.transactionType.findFirst({ where: { organizationId: user.orgId, behavior: 'EXPENSE', name: 'รายจ่าย' }});
        if (!type) type = await prisma.transactionType.findFirst({ where: { organizationId: user.orgId, behavior: 'EXPENSE' }});
        if (!type) {
            // fallback create
            type = await prisma.transactionType.create({ data: { name: 'รายจ่าย', behavior: 'EXPENSE', organizationId: user.orgId, isActive: true }})
        }

        let transferCat = await prisma.transactionCategory.findFirst({ where: { organizationId: user.orgId, name: 'โอนออกภายใน' } });
        if (!transferCat) {
           transferCat = await prisma.transactionCategory.create({ data: { name: 'โอนออกภายใน', organizationId: user.orgId, typeId: type.id, isActive: true } });
        }

        const sourceTx = await processSingleLeg(fromAccountId, transferCat.id, transferCat.typeId, destTx.id);
        
        await prisma.transaction.update({
           where: { id: destTx.id },
           data: { linkedTransactionId: sourceTx.id }
        });

        return reply.status(201).send({ message: 'Transfer created successfully', transaction: destTx });
    } else {
        const targetAccId = accountId || fromAccountId || toAccountId;
        if (!targetAccId) return reply.status(400).send({ error: 'No account selected' });

        const tx = await processSingleLeg(targetAccId, body.categoryId, baseTypeId as string, null);
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
    const user = request.user as { sub: string, orgId: string };
    const { id } = request.params as { id: string };
    const body = transactionSchema.parse(request.body);

    body.amount = Math.abs(body.amount);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.orgId) {
      return reply.status(404).send({ error: 'Transaction not found or unauthorized' });
    }

    let typeId = body.typeId || existing.typeId;
    if (body.categoryId !== existing.categoryId && !body.typeId) {
      const category = await prisma.transactionCategory.findUnique({ where: { id: body.categoryId } });
      if (category) typeId = category.typeId;
    }

    // Determine accountId
    const targetAccountId = body.accountId || body.toAccountId || body.fromAccountId || existing.accountId;

    let assetId: string | null = existing.assetId;
    let liabilityId: string | null = existing.liabilityId;

    if (targetAccountId && targetAccountId !== existing.accountId) {
      const account = await prisma.account.findUnique({ where: { id: targetAccountId } });
      if (account) {
        if (account.type === 'LIABILITY') {
          const l = await prisma.liability.findUnique({ where: { accountId: targetAccountId } });
          liabilityId = l?.id || null;
          assetId = null;
        } else {
          const a = await prisma.asset.findUnique({ where: { accountId: targetAccountId } });
          assetId = a?.id || null;
          liabilityId = null;
        }
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        accountId: targetAccountId,
        categoryId: body.categoryId,
        amount: body.amount,
        description: body.description !== undefined ? body.description : existing.description,
        note: body.note !== undefined ? body.note : existing.note,
        typeId,
        assetId,
        liabilityId,
        date: body.date ? new Date(body.date) : existing.date,
        actualDate: body.actualDate !== undefined ? (body.actualDate ? new Date(body.actualDate) : null) : existing.actualDate,
      },
      include: {
        account: { include: { bank: { select: { name: true, color: true } } } },
        asset: true,
        liability: true,
        category: { include: { type: true } },
        type: true
      }
    });

    await adjustAccountBalance(existing.accountId, existing.amount, existing.typeId, true);
    await adjustAccountBalance(updated.accountId, updated.amount, updated.typeId);

    // Sync linked transaction amount/description/date
    if (existing.linkedTransactionId) {
       const linked = await prisma.transaction.findUnique({ where: { id: existing.linkedTransactionId }});
       if (linked) {
          await adjustAccountBalance(linked.accountId, linked.amount, linked.typeId, true);
          await prisma.transaction.update({
             where: { id: linked.id },
             data: { 
                 amount: updated.amount, 
                 date: updated.date, 
                 actualDate: updated.actualDate,
                 description: updated.description
             }
          });
          await adjustAccountBalance(linked.accountId, updated.amount, linked.typeId);
       }
    }

    return reply.send({ message: 'Transaction updated', transaction: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, orgId: string };
    const { id } = request.params as { id: string };

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.orgId) {
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
    const user = request.user as { sub: string, orgId: string };
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
            organizationId: user.orgId,
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
