import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nexworth/database';
import { z } from 'zod';
import { AccountType } from '@prisma/client';

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().optional().nullable(),
  type: z.nativeEnum(AccountType),
  bankId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isPersonal: z.boolean().default(true),
  actualDate: z.string().datetime().optional().nullable(),
});

export const listAccountsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, role: string, organizationId: string };
    
    // Strict isolation by organizationId
    const whereClause = { organizationId: user.organizationId };

    const accounts = await prisma.account.findMany({
      where: whereClause,
      include: {
        bank: true,
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ accounts });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createAccountHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = accountSchema.parse(request.body);
    const user = request.user as { sub: string, organizationId: string };
    
    // Relaxed bankId requirement
    /*
    if (body.type === 'BANK' && !body.bankId) {
      return reply.status(400).send({ error: 'Bank ID is required for BANK accounts' });
    }
    if (body.type !== 'BANK') {
      body.bankId = null;
    }
    */

    const newAccount = await prisma.account.create({
      data: {
        userId: user.sub,
        organizationId: user.organizationId,
        name: body.name,
        accountNumber: body.accountNumber || "",
        type: body.type,
        bankId: body.bankId,
        isActive: body.isActive,
        isPersonal: body.isPersonal,
        actualDate: body.actualDate ? new Date(body.actualDate) : null,
      },
      include: { bank: true }
    });

    return reply.status(201).send({ message: 'Account created', account: newAccount });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateAccountHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = request.params.id;
    const body = accountSchema.parse(request.body);
    const user = request.user as { sub: string, role: string, organizationId: string };
    
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Account not found' });

    // Check organization isolation
    if (existing.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Forbidden: Access to other organization denied' });
    }

    /*
    if (body.type === 'BANK' && !body.bankId) {
      return reply.status(400).send({ error: 'Bank ID is required for BANK accounts' });
    }
    if (body.type !== 'BANK') {
      body.bankId = null;
    }
    */

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name: body.name,
        accountNumber: body.accountNumber || "",
        type: body.type,
        bankId: body.bankId,
        isActive: body.isActive,
        isPersonal: body.isPersonal,
        actualDate: body.actualDate ? new Date(body.actualDate) : null,
      },
      include: { bank: true }
    });

    return reply.send({ message: 'Account updated', account: updatedAccount });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteAccountHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = request.params.id;
    const user = request.user as { sub: string, role: string, organizationId: string };

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Account not found' });

    // Check organization isolation
    if (existing.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Forbidden: Access to other organization denied' });
    }

    await prisma.account.delete({ where: { id } });
    return reply.send({ message: 'Account deleted' });
  } catch (error) {
    request.log.error({ id: request.params.id, error }, 'Delete Account Error');
    return reply.status(500).send({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
