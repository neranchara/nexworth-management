import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nexworth/database';
import { z } from 'zod';
import { FinancialRecordType, AccountType } from '@prisma/client';

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
        note: 'Real-time balance',
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
          type: body.newAccountType as AccountType,
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
      const amount = isLiability ? -Math.abs(body.amount) : body.amount;
      
      let updatedValue;
      if (isLiability) {
        updatedValue = await prisma.liability.upsert({
          where: { accountId: targetAccountId },
          update: { amount: amount },
          create: {
            accountId: targetAccountId,
            amount: amount,
            userId: user.sub,
          },
          include: { account: { include: { bank: true } } }
        });
      } else {
        updatedValue = await prisma.asset.upsert({
          where: { accountId: targetAccountId },
          update: { amount: amount },
          create: {
            accountId: targetAccountId,
            amount: amount,
            userId: user.sub,
          },
          include: { account: { include: { bank: true } } }
        });
      }

      return reply.status(201).send({ 
        message: 'Value updated', 
        record: {
          id: `acc-${targetAccountId}`,
          accountId: targetAccountId,
          amount: body.amount,
          date: updatedValue.updatedAt,
          type: body.type,
          note: body.note || 'Manual update',
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
      const amount = isLiability ? -Math.abs(body.amount) : body.amount;

      let updatedValue;
      if (isLiability) {
        updatedValue = await prisma.liability.update({
          where: { accountId },
          data: { amount },
          include: { account: { include: { bank: true } } }
        });
      } else {
        updatedValue = await prisma.asset.update({
          where: { accountId },
          data: { amount },
          include: { account: { include: { bank: true } } }
        });
      }

      return reply.send({ 
        message: 'Value updated', 
        record: {
          id,
          accountId: updatedValue.accountId,
          amount: body.amount,
          date: updatedValue.updatedAt,
          type: body.type,
          note: body.note || 'Real-time update',
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
