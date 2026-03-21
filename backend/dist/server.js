import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
dotenv.config();
export const prisma = new PrismaClient();
const buildServer = async () => {
    const server = Fastify({ logger: true });
    // Plugins
    await server.register(cors);
    await server.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'supersecret'
    });
    // Health Check Route
    server.get('/health', async () => {
        return { status: 'ok' };
    });
    // API Routes
    server.register(authRoutes, { prefix: '/api/v1/auth' });
    server.register(userRoutes, { prefix: '/api/v1' });
    return server;
};
const start = async () => {
    const server = await buildServer();
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
