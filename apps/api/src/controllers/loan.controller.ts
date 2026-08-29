import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { SYSTEM_CATEGORY_KEYS, BEHAVIOR_METADATA } from '../constants/transactionConfig.js';

type LoanBehavior = 'LOAN_BORROW' | 'LOAN_REPAY' | 'LEND_OUT' | 'LEND_REPAY';

const createLoanSchema = z.object({
  name: z.string().min(1),
  accountId: z.string().uuid(),
  initialAmount: z.number().positive(),
  direction: z.enum(['BORROW', 'LEND']).default('BORROW'),
  borrowerName: z.string().optional(),
  date: z.string().datetime().optional(),
  actualDate: z.string().datetime().nullable().optional(),
  note: z.string().optional(),
});

const updateLoanSchema = z.object({
  name: z.string().min(1).optional(),
  accountId: z.string().uuid().optional(),
  borrowerName: z.string().nullable().optional(),
  actualDate: z.string().datetime().nullable().optional(),
});

const addTransactionSchema = z.object({
  type: z.enum(['BORROW', 'REPAY']),
  amount: z.number().positive(),
  accountId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
  actualDate: z.string().datetime().optional(),
  note: z.string().optional(),
});

const BEHAVIOR_MAP: Record<string, Record<string, LoanBehavior>> = {
  BORROW: { BORROW: 'LOAN_BORROW', REPAY: 'LOAN_REPAY' },
  LEND:   { BORROW: 'LEND_OUT',    REPAY: 'LEND_REPAY' },
};

const SYSTEM_KEY_MAP: Record<LoanBehavior, string> = {
  LOAN_BORROW: SYSTEM_CATEGORY_KEYS.LOAN_BORROW_SYS,
  LOAN_REPAY:  SYSTEM_CATEGORY_KEYS.LOAN_REPAY_SYS,
  LEND_OUT:    SYSTEM_CATEGORY_KEYS.LEND_OUT_SYS,
  LEND_REPAY:  SYSTEM_CATEGORY_KEYS.LEND_REPAY_SYS,
};

const FALLBACK_NAME_MAP: Record<LoanBehavior, string> = {
  LOAN_BORROW: 'ยืมเงินภายใน',
  LOAN_REPAY:  'คืนเงินภายใน',
  LEND_OUT:    'ให้ยืมเงิน',
  LEND_REPAY:  'รับเงินคืน',
};

const getCategory = async (behavior: LoanBehavior, organizationId: string) => {
  const systemKey = SYSTEM_KEY_MAP[behavior];
  const fallbackName = FALLBACK_NAME_MAP[behavior];
  const meta = BEHAVIOR_METADATA[behavior];

  let cat = await prisma.transactionCategory.findFirst({
    where: { systemKey, organizationId },
    include: { type: true }
  });

  if (!cat) {
    cat = await prisma.transactionCategory.findFirst({
      where: { name: fallbackName, organizationId, type: { behavior } },
      include: { type: true }
    });
    if (cat) await prisma.transactionCategory.update({ where: { id: cat.id }, data: { systemKey } });
  }

  if (!cat) {
    let type = await prisma.transactionType.findFirst({ where: { behavior, organizationId } });
    if (!type) {
      type = await prisma.transactionType.create({
        data: { name: fallbackName, behavior, organizationId, defaultDirection: meta.defaultDirection, isExpenseLike: meta.isExpenseLike, cashflowBucket: meta.cashflowBucket }
      });
    }
    cat = await prisma.transactionCategory.create({
      data: { name: fallbackName, typeId: type.id, organizationId, systemKey },
      include: { type: true }
    });
  }

  return { ...cat, type: cat.type };
};

const adjustAssetBalance = async (accountId: string, amount: number, type: 'INCREASE' | 'DECREASE') => {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.type === 'LIABILITY') return;

  const adjustment = type === 'INCREASE' ? amount : -amount;

  await prisma.asset.upsert({
    where: { accountId },
    update: { amount: { increment: adjustment } },
    create: { accountId, amount: adjustment, userId: account.userId, organizationId: account.organizationId }
  });
};

export const listLoansHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { direction } = request.query as { direction?: string };

    const loans = await prisma.loan.findMany({
      where: {
        organizationId: user.organizationId,
        ...(direction ? { direction } : {})
      },
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

    const orphanedIds = loans
      .filter(l => !l.asset?.account && !l.liability?.account)
      .map(l => l.accountId);

    const directAccounts = orphanedIds.length > 0
      ? await prisma.account.findMany({
          where: { id: { in: orphanedIds } },
          select: { id: true, name: true }
        })
      : [];
    const directAccountMap = new Map(directAccounts.map(a => [a.id, a.name]));

    const parsedLoans = loans.map(loan => {
      const loanDirection = loan.direction || 'BORROW';
      const primaryBehavior   = loanDirection === 'LEND' ? 'LEND_OUT'    : 'LOAN_BORROW';
      const secondaryBehavior = loanDirection === 'LEND' ? 'LEND_REPAY'  : 'LOAN_REPAY';

      let lent = 0;
      let repaid = 0;
      let latestRepaymentDate: Date | null = null;

      loan.transactions.forEach(tx => {
        const behavior = tx.type?.behavior || tx.category.type?.behavior;
        if (behavior === primaryBehavior) lent += tx.amount;
        if (behavior === secondaryBehavior) {
          repaid += tx.amount;
          const refDate = tx.actualDate ? new Date(tx.actualDate) : new Date(tx.date);
          if (!latestRepaymentDate || refDate > latestRepaymentDate) {
            latestRepaymentDate = refDate;
          }
        }
      });

      const accountInfo = loan.asset?.account || loan.liability?.account;

      return {
        id: loan.id,
        code: loan.code,
        name: loan.name,
        direction: loanDirection,
        borrowerName: loan.borrowerName || null,
        accountId: loan.accountId,
        accountName: accountInfo?.name || directAccountMap.get(loan.accountId) || 'บัญชีที่ถูกลบ',
        date: loan.date,
        actualDate: loan.actualDate,
        status: lent <= repaid ? 'PAID' : 'ACTIVE',
        totalBorrowed: lent,
        totalRepaid: repaid,
        balance: lent - repaid,
        latestRepaymentDate,
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

    const account = await prisma.account.findUnique({ where: { id: body.accountId } });
    if (!account || account.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Account not found' });
    }

    const prefix = body.direction === 'LEND' ? 'D' : 'L';
    const count = await prisma.loan.count({ where: { organizationId: user.organizationId, direction: body.direction } });
    const code = `${prefix}${String(count + 1).padStart(3, '0')}`;

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
        direction: body.direction,
        borrowerName: body.borrowerName,
        totalAmount: body.initialAmount,
        date: loanDate,
        actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
      }
    });

    const primaryBehavior: LoanBehavior = body.direction === 'LEND' ? 'LEND_OUT' : 'LOAN_BORROW';
    const category = await getCategory(primaryBehavior, user.organizationId);

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

    // Money always leaves the account on initial create (BORROW=ยืมออก, LEND=ให้ยืม)
    await adjustAssetBalance(body.accountId, body.initialAmount, 'DECREASE');

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

    const loanDirection = loan.direction || 'BORROW';
    const behaviorKey = BEHAVIOR_MAP[loanDirection][body.type];
    const category = await getCategory(behaviorKey, user.organizationId);
    const txDate = body.date ? new Date(body.date) : new Date();

    let txAccountId = loan.accountId;
    let txAssetId = loan.assetId;
    let txLiabilityId = loan.liabilityId;

    if (body.accountId) {
      const account = await prisma.account.findUnique({ where: { id: body.accountId } });
      if (account && account.organizationId === user.organizationId) {
        txAccountId = account.id;
        if (account.type === 'LIABILITY') {
          const l = await prisma.liability.findUnique({ where: { accountId: body.accountId } });
          txLiabilityId = l?.id || null;
          txAssetId = null;
        } else {
          const a = await prisma.asset.findUnique({ where: { accountId: body.accountId } });
          txAssetId = a?.id || null;
          txLiabilityId = null;
        }
      }
    }

    const descLabel = body.type === 'REPAY'
      ? (loanDirection === 'LEND' ? 'รับเงินคืน' : 'คืนเงิน')
      : (loanDirection === 'LEND' ? 'ให้ยืมเพิ่ม' : 'ยืมเพิ่ม');

    await prisma.transaction.create({
      data: {
        userId: user.sub,
        organizationId: user.organizationId,
        accountId: txAccountId,
        assetId: txAssetId,
        liabilityId: txLiabilityId,
        categoryId: category.id,
        typeId: category.type.id,
        loanId: loan.id,
        amount: body.amount,
        date: txDate,
        actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
        note: body.note,
        description: `${descLabel}: ${loan.name}`,
      }
    });

    // Asset balance adjustment:
    // BORROW dir — REPAY: money leaves repay account (DECREASE), extra BORROW: money leaves source (DECREASE)
    // LEND dir   — REPAY: money returns to account (INCREASE), extra LEND: money leaves account (DECREASE)
    if (loanDirection === 'LEND') {
      await adjustAssetBalance(txAccountId, body.amount, body.type === 'REPAY' ? 'INCREASE' : 'DECREASE');
    } else {
      await adjustAssetBalance(txAccountId, body.amount, 'DECREASE');
    }

    return reply.status(201).send({ message: 'Transaction added successfully' });
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
        borrowerName: body.borrowerName !== undefined ? body.borrowerName : undefined,
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
