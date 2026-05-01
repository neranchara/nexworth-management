import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nexworth/database';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  typeId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export const listCategoriesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const categories = await prisma.transactionCategory.findMany({
      where: { organizationId: user.organizationId },
      include: { type: true },
      orderBy: { name: 'asc' },
    });
    return reply.send({ categories });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createCategoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = categorySchema.parse(request.body);
    const exists = await prisma.transactionCategory.findUnique({
      where: { organizationId_name_typeId: { organizationId: user.organizationId, name: body.name, typeId: body.typeId } }
    });
    if (exists) return reply.status(400).send({ error: 'Category already exists for this type' });

    const newCategory = await prisma.transactionCategory.create({ 
      data: { ...body, organizationId: user.organizationId },
      include: { type: true }
    });
    return reply.status(201).send({ message: 'Category created', category: newCategory });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateCategoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    const body = categorySchema.parse(request.body);
    
    const existing = await prisma.transactionCategory.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Category not found or unauthorized' });
    }

    const updated = await prisma.transactionCategory.update({
      where: { id },
      data: body,
    });
    return reply.send({ message: 'Category updated', category: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteCategoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    
    const existing = await prisma.transactionCategory.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return reply.status(404).send({ error: 'Category not found or unauthorized' });
    }

    await prisma.transactionCategory.delete({ where: { id } });
    return reply.send({ message: 'Category deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Delete failed' });
  }
};
