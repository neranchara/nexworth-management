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
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.net' || user.orgName === 'System Management';
    
    // Isolation logic: 
    // - System Admins can see all users.
    // - Org users can only see users within their own organization.
    const whereClause = isSystemAdmin ? {} : { organizationId: user.organizationId };

    const users = await prisma.user.findMany({
      where: whereClause,
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
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.net' || user.orgName === 'System Management';
    const body = createUserSchema.parse(request.body);

    // Isolation: Non-SystemAdmin can only create users in their own organization
    if (!isSystemAdmin && body.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: You can only create users within your own organization' });
    }

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



export const updateUserHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.net' || user.orgName === 'System Management';
    const id = request.params.id;
    const body = updateUserSchema.parse(request.body);

    // 1. Fetch user to check organization
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Isolation Check
    if (isSystemAdmin && targetUser.organizationId !== user.organizationId) {
      // System Admin can only reset password for other orgs
      // We'll check if only password is being updated? 
      // But we have resetPasswordHandler for that.
      // So block full edit.
      return reply.status(403).send({ error: 'Access denied: System Admins can only RESET passwords for users in other organizations, not edit their profile.' });
    }

    if (!isSystemAdmin && targetUser.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: You can only update users within your own organization' });
    }
    
    // If updating organizationId, must be SystemAdmin
    if (body.organizationId && !isSystemAdmin && body.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: Only System Admins can change user organization' });
    }

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
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.net' || user.orgName === 'System Management';
    const id = request.params.id;

    // 1. Fetch user to check organization
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Isolation Check
    if (isSystemAdmin && targetUser.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: System Admins can only RESET passwords for users in other organizations, not delete them.' });
    }

    if (!isSystemAdmin && targetUser.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: You can only delete users within your own organization' });
    }

    await prisma.user.delete({ where: { id } });
    return reply.send({ message: 'User deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const resetPasswordHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.net' || user.orgName === 'System Management';
    const id = request.params.id;

    // 1. Check if the requester is a System Admin
    if (!isSystemAdmin) {
      return reply.status(403).send({ error: 'Access denied: Only System Admins can reset passwords for other organizations' });
    }

    // 2. Fetch the target user and their organization
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { organization: true }
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // 3. Prevent resetting password for users in the SAME System Management organization
    // The requirement says "reset password ให้ user org อื่นได้เท่านั้น"
    if (targetUser.organizationId === user.organizationId) {
       return reply.status(400).send({ error: 'Cannot use this function for users within the same organization' });
    }

    // 4. Generate default password: {orgName}@1234
    const orgName = targetUser.organization?.name || 'nexworth';
    const defaultPassword = `${orgName}@1234`;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 5. Update user password
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    return reply.send({ 
      message: `Password reset successfully for ${targetUser.email}`,
      newPassword: defaultPassword 
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
