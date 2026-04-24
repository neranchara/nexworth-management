import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const permissionSchema = z.object({
  resource: z.string(),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

const bulkPermissionSchema = z.array(permissionSchema);

export const listRolePermissionsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { roleId } = request.params as { roleId: string };

    const permissions = await prisma.permission.findMany({
      where: { roleId },
      orderBy: { resource: 'asc' }
    });

    return reply.send({ permissions });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateRolePermissionsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { roleId } = request.params as { roleId: string };
    const body = bulkPermissionSchema.parse(request.body);

    // Use transaction to ensure consistency
    await prisma.$transaction(
      body.map(p => prisma.permission.upsert({
        where: { roleId_resource: { roleId, resource: p.resource } },
        update: {
          canView: p.canView,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete
        },
        create: {
          roleId,
          resource: p.resource,
          canView: p.canView,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete
        }
      }))
    );

    return reply.send({ message: 'Permissions updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const listAllRolesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = request.user as any;
        const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.net' || user.orgName === 'System Management';

        // 1. Fetch Roles
        const roles = await prisma.role.findMany({
            where: { organizationId: user.organizationId },
            include: { _count: { select: { users: true } } },
            orderBy: { name: 'asc' }
        });

        // 2. Fetch Organizations (Isolation Logic)
        const orgWhere = isSystemAdmin ? {} : { id: user.organizationId };
        const organizations = await prisma.organization.findMany({
            where: orgWhere,
            select: { id: true, name: true }
        });

        return reply.send({ roles, organizations });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createRoleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = request.user as any;
    const { name, description } = roleSchema.parse(request.body);

    const role = await prisma.role.create({
      data: {
        name,
        description,
        organizationId: decoded.organizationId
      }
    });

    return reply.status(201).send({ role });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateRoleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = request.user as any;
    const { roleId } = request.params as { roleId: string };
    const { name, description } = roleSchema.parse(request.body);

    // Ensure the role belongs to the user's org
    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId: decoded.organizationId }
    });

    if (!role) {
      return reply.status(404).send({ error: 'Role not found' });
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: { name, description }
    });

    return reply.send({ role: updatedRole });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteRoleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = request.user as any;
    const { roleId } = request.params as { roleId: string };

    // Ensure the role belongs to the user's org and is not in use
    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId: decoded.organizationId },
      include: { _count: { select: { users: true } } }
    });

    if (!role) {
      return reply.status(404).send({ error: 'Role not found' });
    }

    if (role._count.users > 0) {
      return reply.status(400).send({ error: 'Cannot delete role that is assigned to users' });
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    return reply.send({ message: 'Role deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
