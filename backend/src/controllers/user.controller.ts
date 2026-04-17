import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().uuid(),
  organizationId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});


export const listUsersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        role: {
          select: { name: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    return reply.send({ users });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createUserHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createUserSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return reply.status(409).send({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        roleId: body.roleId,
        organizationId: body.organizationId,
        isActive: body.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: { name: true }
        },
        organization: {
          select: { name: true }
        }
      }
    });

    return reply.status(201).send({ message: 'User created', user: newUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const listRolesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const roles = await prisma.role.findMany({
      include: { _count: { select: { users: true } } }
    });
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });
    return reply.send({ roles, organizations });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateUserHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = request.params.id;
    const body = updateUserSchema.parse(request.body);

    const dataToUpdate: any = { ...body };
    if (body.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(body.password, 10);
      delete dataToUpdate.password;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: { select: { name: true } },
        organization: { select: { name: true } }
      }
    });

    return reply.send({ message: 'User updated', user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteUserHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = request.params.id;
    await prisma.user.delete({ where: { id } });
    return reply.send({ message: 'User deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
