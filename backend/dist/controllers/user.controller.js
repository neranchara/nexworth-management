import { prisma } from '../server.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roleId: z.string().uuid(),
    isActive: z.boolean().default(true),
});
export const listUsersHandler = async (request, reply) => {
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
                }
            }
        });
        return reply.send({ users });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
export const createUserHandler = async (request, reply) => {
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
                }
            }
        });
        return reply.status(201).send({ message: 'User created', user: newUser });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: error.format() });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
export const listRolesHandler = async (request, reply) => {
    try {
        const roles = await prisma.role.findMany();
        return reply.send({ roles });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
