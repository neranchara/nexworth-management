import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

import { prisma } from './lib/prisma.js';

const buildServer = async (): Promise<FastifyInstance> => {
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
  
  const bankRoutes = (await import('./routes/bank.routes.js')).default;
  const accountRoutes = (await import('./routes/account.routes.js')).default;
  
  server.register(bankRoutes, { prefix: '/api/v1' });
  server.register(accountRoutes, { prefix: '/api/v1' });

  return server;
};

const start = async () => {
  const server = await buildServer();
  try {
    await server.listen({ port: 3001, host: '127.0.0.1' });
    console.log('Server listening on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
