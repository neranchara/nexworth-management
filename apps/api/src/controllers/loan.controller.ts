import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createLoanSchema = z.object({
  name: z.string().min(1),
  accountId: z.string().uuid(),
  initialAmount: z.number().positive(),
  date: z.string().datetime().optional(),
  actualDate: z.string().datetime().nullable().optional(),
  note: z.string().optional(),
});

const updateLoanSchema = z.object({
  name: z.string().min(1).optional(),
  accountId: z.string().uuid().optional(),
  actualDate: z.string().datetime().nullable().optional(),
});

const addTransactionSchema = z.object({
  type: z.enum(['BORROW', 'REPAY']),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  actualDate: z.string().datetime().optional(),
  note: z.string().optional(),
});

const getCategory = async (behavior: 'LOAN_BORROW' | 'LOAN_REPAY', organizationId: string) => {
  const name = behavior === 'LOAN_BORROW' ? 'ยืมเงินภายใน' : 'คืนเงินภายใน';
  
  // First find the type by behavior
  let type = await prisma.transactionType.findFirst({
    where: { behavior, organizationId: organizationId }
  });
  
  if (!type) {
    type = await prisma.transactionType.create({
      data: { name, behavior, organizationId: organizationId }
    });
  }

  let category = await prisma.transactionCategory.findFirst({
    where: { typeId: type.id, name, organizationId: organizationId }
  });

  if (!category) {
    category = await prisma.transactionCategory.create({
      data: { name, typeId: type.id, organizationId: organizationId }
    });
  }
  return { ...category, type };
};

/**
 * Adjust asset balance only (Loan Tracker = ระบบโอนภายใน ไม่แตะ Liabilities)
 * BORROW = ยืมเงินออกไป -> Asset ลด
 * REPAY  = รับคืนเงิน   -> Asset เพิ่ม
 */
const adjustAssetBalance = async (accountId: string, amount: number, type: 'BORROW' | 'REPAY', isRemoval: boolean = false) => {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.type === 'LIABILITY') return; // Only process Asset accounts

  // BORROW: ลด, REPAY: เพิ่ม (if isRemoval, invert)
  let adjustment = type === 'REPAY' ? amount : -amount;
  if (isRemoval) adjustment = -adjustment;

  await prisma.asset.upsert({
    where: { accountId },
    update: { amount: { increment: adjustment } },
    create: {
      accountId,
      amount: adjustment,
      userId: account.userId,
      organizationId: account.organizationId
    }
  });
};

export const listLoansHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    
    const loans = await prisma.loan.findMany({
      where: { organizationId: user.organizationId },
      include: {
        asset: { include: { account: { select: { id: true, name: true, bank: true } } } },
        liability: { include: { account: { select: { id: true, name: true, bank: true } } } },
        transactions: {
          include: { category: { include: { type: true } }, type: true },
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedLoans = loans.map(loan => {
      let borrowed = 0;
      let repaid = 0;
      let latestRepaymentActualDate: Date | null = null;
      
      loan.transactions.forEach(tx => {
        const behavior = tx.type?.behavior || tx.category.type?.behavior;
        if (behavior === 'LOAN_BORROW') borrowed += tx.amount;
        if (behavior === 'LOAN_REPAY') {
          repaid += tx.amount;
          if (tx.actualDate) {
             if (!latestRepaymentActualDate || new Date(tx.actualDate) > latestRepaymentActualDate) {
               latestRepaymentActualDate = new Date(tx.actualDate);
             }
          } else if (new Date(tx.date) > (latestRepaymentActualDate || new Date(0))) {
             // Fallback to record date if no actual date
             latestRepaymentActualDate = new Date(tx.date);
          }
        }
      });

      const accountInfo = loan.asset?.account || loan.liability?.account;
      
      return {
        id: loan.id,
        code: loan.code,
        name: loan.name,
        accountId: loan.accountId,
        accountName: accountInfo?.name || 'บัญชีที่ถูกลบ',
        date: loan.date,
        actualDate: loan.actualDate,
        status: borrowed <= repaid ? 'PAID' : 'ACTIVE',
        totalBorrowed: borrowed,
        totalRepaid: repaid,
        balance: borrowed - repaid,
        latestRepaymentDate: latestRepaymentActualDate,
        transactions: loan.transactions
      };
    });

    return reply.send({ loans: parsedLoans });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createLoanHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = createLoanSchema.parse(request.body);
    
    // Verify account exists
    const account = await prisma.account.findUnique({ where: { id: body.accountId } });
    if (!account || account.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Account not found' });
    }

    // Generate a simple code like L001
    const count = await prisma.loan.count({ where: { organizationId: user.organizationId } });
    const code = `L${String(count + 1).padStart(3, '0')}`;

    const loanDate = body.date ? new Date(body.date) : new Date();

    let assetId: string | null = null;
    let liabilityId: string | null = null;

    if (account.type === 'LIABILITY') {
      const l = await prisma.liability.findUnique({ where: { accountId: body.accountId } });
      liabilityId = l?.id || null;
    } else {
      const a = await prisma.asset.findUnique({ where: { accountId: body.accountId } });
      assetId = a?.id || null;
    }

    const newLoan = await prisma.loan.create({
      data: {
        code,
        userId: user.sub,
        organizationId: user.organizationId,
        accountId: body.accountId,
        assetId,
        liabilityId,
        name: body.name,
        totalAmount: body.initialAmount,
        date: loanDate,
        actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
      }
    });

    const category = await getCategory('LOAN_BORROW', user.organizationId);

    await prisma.transaction.create({
      data: {
        userId: user.sub,
        organizationId: user.organizationId,
        accountId: body.accountId,
        assetId,
        liabilityId,
        categoryId: category.id,
        typeId: category.type.id,
        loanId: newLoan.id,
        amount: body.initialAmount,
        date: loanDate,
        actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
        note: body.note,
        description: body.name,
      }
    });

    // Update Asset balance: BORROW = ยืมเงินออก -> ยอด Asset ลด
    await adjustAssetBalance(body.accountId, body.initialAmount, 'BORROW');

    return reply.status(201).send({ message: 'Loan created successfully', loan: newLoan });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const addLoanTransactionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id: loanId } = request.params as { id: string };
    const body = addTransactionSchema.parse(request.body);

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || loan.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Loan not found' });
    }

    const categoryType = body.type === 'BORROW' ? 'LOAN_BORROW' : 'LOAN_REPAY';
    const category = await getCategory(categoryType, user.organizationId);
    const txDate = body.date ? new Date(body.date) : new Date();

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.sub,
        organizationId: user.organizationId,
        accountId: loan.accountId,
        assetId: loan.assetId,
        liabilityId: loan.liabilityId,
        categoryId: category.id,
        typeId: category.type.id,
        loanId: loan.id,
        amount: body.amount,
        date: txDate,
        actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
        note: body.note,
        description: `${body.type === 'BORROW' ? 'ยืมเพิ่ม' : 'คืนเงิน'}: ${loan.name}`,
      }
    });

    // Update Asset balance based on transaction type
    // BORROW = ยืมออกไปเพิ่ม -> ยอด Asset ลด
    // REPAY  = รับคืนมา       -> ยอด Asset เพิ่ม
    await adjustAssetBalance(loan.accountId, body.amount, body.type);

    return reply.status(201).send({ message: 'Transaction added successfully', transaction });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateLoanHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    const body = updateLoanSchema.parse(request.body);

    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan || loan.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Loan not found' });
    }

    let assetId = loan.assetId;
    let liabilityId = loan.liabilityId;

    if (body.accountId && body.accountId !== loan.accountId) {
      const account = await prisma.account.findUnique({ where: { id: body.accountId } });
      if (account) {
        if (account.type === 'LIABILITY') {
          const l = await prisma.liability.findUnique({ where: { accountId: body.accountId } });
          liabilityId = l?.id || null;
          assetId = null;
        } else {
          const a = await prisma.asset.findUnique({ where: { accountId: body.accountId } });
          assetId = a?.id || null;
          liabilityId = null;
        }
      }
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        name: body.name,
        accountId: body.accountId,
        assetId,
        liabilityId,
        actualDate: body.actualDate !== undefined ? (body.actualDate ? new Date(body.actualDate) : null) : undefined,
      }
    });

    return reply.send({ message: 'Loan updated successfully', loan: updatedLoan });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
