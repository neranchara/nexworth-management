import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { setupOrganizationDefaults } from '../services/organization.service.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { SYSTEM_ORG_NAME } from '../constants/systemConfig.js';

const createOrgSchema = z.object({
  name: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  adminFirstName: z.string().optional(),
  adminLastName: z.string().optional(),
});

export const createOrganizationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    if (!user.isSystemAdmin) {
      return reply.status(403).send({ error: 'Only System Admins can create organizations' });
    }

    const { name, adminEmail, adminPassword, adminFirstName, adminLastName } = createOrgSchema.parse(request.body);

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return reply.status(400).send({ error: 'Email already exists' });
    }

    // 2. Create Organization
    const org = await prisma.organization.create({
      data: { name }
    });

    // 3. Create Admin User for this Org
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        organizationId: org.id
      }
    });

    // 4. Setup Defaults
    await setupOrganizationDefaults(org.id, adminUser.id);

    return reply.status(201).send({ 
      message: 'Organization created successfully', 
      organization: org,
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const listOrganizationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    if (!user.isSystemAdmin) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, transactions: true, accounts: true }
        }
      }
    });

    return reply.send(orgs);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateOrganizationHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    if (!user.isSystemAdmin) {
      return reply.status(403).send({ error: 'Only System Admins can update organizations' });
    }

    const { id } = request.params;
    const body = updateOrgSchema.parse(request.body);

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    // 1. Lock System Management
    if (org.name === SYSTEM_ORG_NAME) {
      return reply.status(403).send({ error: 'System Management organization cannot be modified or disabled.' });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: body
    });

    return reply.send({ message: 'Organization updated successfully', organization: updatedOrg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.format() });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
