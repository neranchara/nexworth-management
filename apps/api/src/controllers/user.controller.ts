import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
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
  liquidityDangerZone: z.number().optional(),
  liquiditySafeZone: z.number().optional(),
});


export const listUsersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.orgName === 'System Management';
    
    const { orgId } = request.query as { orgId?: string };
    const targetOrgId = (isSystemAdmin && orgId) ? orgId : user.organizationId;
    const isSuperAdmin = user.role === 'Super Admin' || user.email === 'superadmin@nexworth.online';

    // Standard view: only show users of the target organization
    const whereClause: any = {
      organizationId: targetOrgId
    };

    // Visibility Logic for System Management:
    // If Login User is NOT Super Admin, they cannot see Super Admins of the same organization
    if (!isSuperAdmin && targetOrgId === user.organizationId && user.orgName === 'System Management') {
      whereClause.role = {
        name: { not: 'Super Admin' }
      };
    }

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
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.orgName === 'System Management';
    const body = createUserSchema.parse(request.body);

    // Isolation: Non-SystemAdmin can only create users in their own organization
    if (!isSystemAdmin && body.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: You can only create users within your own organization' });
    }

    const normalizedEmail = body.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return reply.status(409).send({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
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
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.orgName === 'System Management';
    const id = request.params.id;
    const body = updateUserSchema.parse(request.body);

    // 1. Fetch user to check organization
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const isSelfUpdate = targetUser.id === user.sub;

    // Isolation Check
    if (isSystemAdmin) {
      if (!isSelfUpdate && targetUser.organizationId !== user.organizationId) {
        // System Admin can only reset password or toggle active status for other orgs
        const allowedFields = ['password', 'isActive'];
        const attemptFields = Object.keys(request.body as object);
        const isTryingForbidden = attemptFields.some(f => !allowedFields.includes(f));
        
        if (isTryingForbidden) {
          return reply.status(403).send({ error: 'Access denied: System Admins can only RESET passwords or toggle ACTIVE status for users in other organizations, not edit other profile details.' });
        }
      } else if (!isSelfUpdate && targetUser.isSystemAdmin && targetUser.id !== user.sub && (request.body as any).isActive !== undefined) {
        // Prevent System Admin from deactivating OTHER System Admins in the same Master Org
        return reply.status(403).send({ error: 'Access denied: You cannot change the status of other System Administrators.' });
      }
    }

    if (!isSystemAdmin && !isSelfUpdate && targetUser.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: You can only update users within your own organization or your own profile' });
    }
    
    // If updating organizationId, must be SystemAdmin
    if (body.organizationId && !isSystemAdmin && body.organizationId !== user.organizationId) {
      return reply.status(403).send({ error: 'Access denied: Only System Admins can change user organization' });
    }

    const dataToUpdate: any = { ...body };
    if (body.email) {
      dataToUpdate.email = body.email.toLowerCase().trim();
    }
    if (body.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(body.password, 10);
      delete dataToUpdate.password;
    }

    console.log(`[DEBUG] Updating user ${id}:`, dataToUpdate);

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
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.orgName === 'System Management';
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

    await prisma.user.update({ 
      where: { id },
      data: { isActive: false }
    });
    return reply.send({ message: 'User deactivated (Soft Delete)' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const resetPasswordHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.online' || user.orgName === 'System Management';
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

    // 4. Generate random password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let randomPassword = "";
    for (let i = 0; i < 12; i++) {
      randomPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // 5. Update user password
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    // 6. Mock sending email
    console.log(`[MOCK EMAIL] Sending NEW password to ${targetUser.email}: ${randomPassword}`);

    return reply.send({ 
      message: `A new random password has been generated and sent to ${targetUser.email}.`
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const requestResetPasswordHandler = async (request: any, reply: any) => {
  try {
    const user = request.user;
    const id = request.params.id;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return reply.status(404).send({ error: "User not found" });

    const isSystemAdmin = user.isSystemAdmin || user.email === "superadmin@nexworth.online" || user.organizationId === "7f4b8f80-dfb7-4492-9a06-28dad5691dd7";
    if (!isSystemAdmin && targetUser.id !== user.sub) return reply.status(403).send({ error: "Access denied" });

    console.log("[MOCK EMAIL] Sending reset password link to: " + targetUser.email);
    return reply.send({ message: "Reset link has been sent to " + targetUser.email + ". Please check your inbox." });
  } catch (error) {
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};
