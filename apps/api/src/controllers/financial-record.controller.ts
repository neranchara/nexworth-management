import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { FinancialRecordType } from '@prisma/client';
import { adjustAccountBalance, getSystemCategory } from './transaction.controller.js';
import { SYSTEM_CATEGORY_KEYS } from '../constants/transactionConfig.js';

const financialRecordSchema = z.object({
  accountId: z.string().uuid().optional().nullable(),
  newAccountName: z.string().optional().nullable(),
  newAccountType: z.string().optional().nullable(), // For new account creation
  bankId: z.string().uuid().optional().nullable(),
  amount: z.number(),
  date: z.string().optional().nullable(),
  type: z.nativeEnum(FinancialRecordType), // Logic type (ASSET/LIABILITY)
  note: z.string().optional().nullable(),
});

// NEX-FEAT-12: manual balance edits (Liabilities/Assets pages) now post a real Transaction
// instead of upserting Liability.amount/Asset.amount directly — the transaction ledger becomes
// the single source of truth for every account's balance, so it can never drift out of sync
// with the sign/multiplier convention again (see NEX-BUG-12).
async function postBalanceAdjustmentAndGetRecord(
  targetAccountId: string,
  isLiability: boolean,
  targetAmount: number,
  note: string | null | undefined,
  userId: string,
  organizationId: string
) {
  return prisma.$transaction(async (tx) => {
    const current = isLiability
      ? await tx.liability.findUnique({ where: { accountId: targetAccountId } })
      : await tx.asset.findUnique({ where: { accountId: targetAccountId } });
    const delta = targetAmount - (current?.amount ?? 0);

    const category = await getSystemCategory(
      tx, SYSTEM_CATEGORY_KEYS.BALANCE_ADJUSTMENT_SYS, 'ปรับยอดเปิดบัญชี', 'BALANCE_ADJUSTMENT', organizationId
    );
    if (!category) throw new Error('Cannot find or create BALANCE_ADJUSTMENT category');

    if (delta !== 0) {
      // adjustAccountBalance resolves BALANCE_ADJUSTMENT with direction=null to a flat +1
      // multiplier for both asset and liability accounts, so the signed delta applies as-is.
      await adjustAccountBalance(targetAccountId, delta, category.typeId, null, false, tx);

      const linked = isLiability
        ? await tx.liability.findUnique({ where: { accountId: targetAccountId } })
        : await tx.asset.findUnique({ where: { accountId: targetAccountId } });

      await tx.transaction.create({
        data: {
          organizationId,
          userId,
          accountId: targetAccountId,
          categoryId: category.id,
          typeId: category.typeId,
          amount: Math.abs(delta),
          direction: null,
          assetId: !isLiability ? linked?.id : null,
          liabilityId: isLiability ? linked?.id : null,
          note: note ?? undefined,
          date: new Date(),
        },
      });
    }

    if (note !== undefined) {
      // Keep the note editable even when the balance itself didn't change (delta === 0),
      // and make sure the row exists on a first save of amount 0.
      if (isLiability) {
        await tx.liability.upsert({
          where: { accountId: targetAccountId },
          update: { note },
          create: { accountId: targetAccountId, amount: targetAmount, note, userId },
        });
      } else {
        await tx.asset.upsert({
          where: { accountId: targetAccountId },
          update: { note },
          create: { accountId: targetAccountId, amount: targetAmount, note, userId },
        });
      }
    }

    return isLiability
      ? tx.liability.findUnique({ where: { accountId: targetAccountId }, include: { account: { include: { bank: true } } } })
      : tx.asset.findUnique({ where: { accountId: targetAccountId }, include: { account: { include: { bank: true } } } });
  });
}

export const listFinancialRecordsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { type } = request.query as { type?: FinancialRecordType };

    if (type === 'ASSET' || type === 'LIABILITY') {
      const isLiability = type === 'LIABILITY';
      const records = isLiability 
        ? await prisma.liability.findMany({
            where: { account: { organizationId: user.organizationId } },
            include: { account: { include: { bank: true } } },
            orderBy: { account: { name: 'asc' } }
          })
        : await prisma.asset.findMany({
            where: { account: { organizationId: user.organizationId } },
            include: { account: { include: { bank: true } } },
            orderBy: { account: { name: 'asc' } }
          });

      const formattedRecords = records.map(r => ({
        id: `acc-${r.accountId}`,
        accountId: r.accountId,
        amount: r.amount,
        date: r.updatedAt,
        type: type,
        note: r.note || 'Real-time balance',
        account: r.account
      }));

      return reply.send({ records: formattedRecords });
    }

    // Default: return snapshots from the table
    const whereClause: any = { organizationId: user.organizationId };
    if (type) whereClause.type = type;

    const records = await prisma.financialRecord.findMany({
      where: whereClause,
      include: {
        account: {
          include: { bank: true }
        }
      },
      orderBy: { date: 'desc' },
    });
    return reply.send({ records });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createFinancialRecordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = financialRecordSchema.parse(request.body);

    let targetAccountId = body.accountId;

    // Handle new account creation if accountId is missing
    if (!targetAccountId && body.newAccountName && body.newAccountType) {
      const newAccount = await prisma.account.create({
        data: {
          name: body.newAccountName,
          type: body.newAccountType,
          bankId: body.bankId,
          userId: user.sub,
          organizationId: user.organizationId,
          isActive: true
        }
      });
      targetAccountId = newAccount.id;
    }

    if (!targetAccountId) {
      return reply.status(400).send({ error: 'AccountId or New Account details are required' });
    }

    if (body.type === 'ASSET' || body.type === 'LIABILITY') {
      const isLiability = body.type === 'LIABILITY';
      // NEX-BUG-12: positive = amount owed, matching transaction.controller.ts's convention.
      const amount = isLiability ? Math.abs(body.amount) : body.amount;

      const updatedValue = await postBalanceAdjustmentAndGetRecord(
        targetAccountId, isLiability, amount, body.note, user.sub, user.organizationId
      );
      if (!updatedValue) return reply.status(500).send({ error: 'Failed to post balance adjustment' });

      return reply.status(201).send({
        message: 'Value updated',
        record: {
          id: `acc-${targetAccountId}`,
          accountId: targetAccountId,
          amount: body.amount,
          date: updatedValue.updatedAt,
          type: body.type,
          note: updatedValue.note || 'Manual update',
          account: updatedValue.account
        }
      });
    }

    // Only create a record if it's NOT a real-time Asset/Liability update
    const record = await prisma.financialRecord.create({
      data: {
        accountId: targetAccountId,
        amount: body.amount,
        type: body.type,
        note: body.note,
        userId: user.sub,
        organizationId: user.organizationId,
        date: body.date ? new Date(body.date) : new Date(),
      },
      include: {
        account: {
          include: { bank: true }
        }
      }
    });

    return reply.status(201).send({ message: 'Financial record created', record });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateFinancialRecordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    const body = financialRecordSchema.parse(request.body);

    if (id.startsWith('acc-')) {
      const accountId = id.replace('acc-', '');
      const isLiability = body.type === 'LIABILITY';
      // NEX-BUG-12: see note in createFinancialRecordHandler — positive = amount owed.
      const amount = isLiability ? Math.abs(body.amount) : body.amount;

      const updatedValue = await postBalanceAdjustmentAndGetRecord(
        accountId, isLiability, amount, body.note, user.sub, user.organizationId
      );
      if (!updatedValue) return reply.status(404).send({ error: 'Asset or Liability record not found' });

      return reply.send({
        message: 'Value updated',
        record: {
          id,
          accountId: updatedValue.accountId,
          amount: body.amount,
          date: updatedValue.updatedAt,
          type: body.type,
          note: updatedValue.note || 'Real-time update',
          account: updatedValue.account
        }
      });
    }

    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Record not found or unauthorized' });
    }

    const updated = await prisma.financialRecord.update({
      where: { id },
      data: {
        amount: body.amount,
        type: body.type,
        note: body.note,
        date: body.date ? new Date(body.date) : existing.date,
      },
      include: {
        account: {
          include: { bank: true }
        }
      }
    });

    return reply.send({ message: 'Financial record updated', record: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteFinancialRecordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };

    if (id.startsWith('acc-')) {
      const accountId = id.replace('acc-', '');
      // Deleting a real-time record means removing the tracking entry (Asset/Liability)
      // but keeping the master Account record intact.
      const assetDeleted = await prisma.asset.deleteMany({
        where: { accountId, account: { organizationId: user.organizationId } }
      });
      const liabilityDeleted = await prisma.liability.deleteMany({
        where: { accountId, account: { organizationId: user.organizationId } }
      });

      if (assetDeleted.count === 0 && liabilityDeleted.count === 0) {
        return reply.status(404).send({ error: 'Asset or Liability record not found' });
      }

      return reply.send({ message: 'Asset record removed successfully' });
    }

    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Record not found or unauthorized' });
    }

    await prisma.financialRecord.delete({ where: { id } });
    return reply.send({ message: 'Financial record deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
