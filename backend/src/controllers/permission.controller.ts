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
        const roles = await prisma.role.findMany({
            include: { _count: { select: { users: true } } }
        });
        return reply.send({ roles });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
