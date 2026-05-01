import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@nexworth/database';

const bankSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1),
  color: z.string().optional().nullable(),
});

export const listBanksHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const banks = await prisma.bank.findMany({ 
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' } 
    });
    return reply.send({ banks });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createBankHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = bankSchema.parse(request.body);
    
    // Check if code exists for this org
    const existing = await prisma.bank.findUnique({ 
      where: { organizationId_code: { organizationId: user.organizationId, code: body.code } } 
    });
    if (existing) return reply.status(400).send({ error: 'Bank code already exists in your organization' });

    const newBank = await prisma.bank.create({ 
      data: { ...body, organizationId: user.organizationId } 
    });
    return reply.status(201).send({ message: 'Bank created', bank: newBank });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateBankHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params;
    const body = bankSchema.parse(request.body);

    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Bank not found or unauthorized' });
    }

    // Check code collision if code changed
    if (body.code !== existing.code) {
      const codeExists = await prisma.bank.findUnique({ 
        where: { organizationId_code: { organizationId: user.organizationId, code: body.code } } 
      });
      if (codeExists) return reply.status(400).send({ error: 'Bank code already exists' });
    }

    const updated = await prisma.bank.update({
      where: { id },
      data: body,
    });
    return reply.send({ message: 'Bank updated', bank: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteBankHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params;
    
    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Bank not found or unauthorized' });
    }

    // Check if used by any accounts
    const accountCount = await prisma.account.count({ where: { bankId: id, organizationId: user.organizationId } });
    if (accountCount > 0) {
      return reply.status(400).send({ error: 'Cannot delete bank as it is in use by accounts' });
    }

    await prisma.bank.delete({ where: { id } });
    return reply.send({ message: 'Bank deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
