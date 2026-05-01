import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nexworth/database';
import { z } from 'zod';
import { TransactionBehavior } from '@prisma/client';

const typeSchema = z.object({
  name: z.string().min(1),
  behavior: z.string(), // Relaxed from nativeEnum to allow new enum values without re-generate
  isActive: z.boolean().default(true),
});

export const listTypesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const types = await prisma.transactionType.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    });
    return reply.send({ types });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createTypeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = typeSchema.parse(request.body);

    const exists = await prisma.transactionType.findUnique({
      where: { organizationId_name: { organizationId: user.organizationId, name: body.name } }
    });
    if (exists) return reply.status(400).send({ error: 'Type already exists' });

    const newType = await prisma.transactionType.create({ 
      data: { 
        ...body, 
        behavior: body.behavior as any,
        organizationId: user.organizationId 
      } 
    });
    return reply.status(201).send({ message: 'Type created', type: newType });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateTypeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    const body = typeSchema.parse(request.body);
    
    const existing = await prisma.transactionType.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Type not found or unauthorized' });
    }

    const updated = await prisma.transactionType.update({
      where: { id },
      data: {
        ...body,
        behavior: body.behavior as any
      },
    });
    return reply.send({ message: 'Type updated', type: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteTypeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    
    const existing = await prisma.transactionType.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Type not found or unauthorized' });
    }

    // Check if any categories use this type
    const used = await prisma.transactionCategory.findFirst({ where: { typeId: id } });
    if (used) return reply.status(400).send({ error: 'Cannot delete type that is in use by categories' });

    await prisma.transactionType.delete({ where: { id } });
    return reply.send({ message: 'Type deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Delete failed' });
  }
};
