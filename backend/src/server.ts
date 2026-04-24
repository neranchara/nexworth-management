import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import * as dotenv from 'dotenv';
import fastifyRawBody from 'fastify-raw-body';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile });
console.log(`Loading environment from: ${envFile}`);

const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ logger: true });

  // Plugins
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });
  await server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
  });
  await server.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true
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
  const categoryRoutes = (await import('./routes/category.routes.js')).default;
  
  const dashboardRoutes = (await import('./routes/dashboard.routes.js')).default;
  const { loanRoutes } = await import('./routes/loan.routes.js');
  const typeRoutes = (await import('./routes/type.routes.js')).default;
  const permissionRoutes = (await import('./routes/permission.routes.js')).default;

  const financialRecordRoutes = (await import('./routes/financial-record.routes.js')).default;

  server.register(bankRoutes, { prefix: '/api/v1' });
  server.register(accountRoutes, { prefix: '/api/v1' });
  server.register(typeRoutes, { prefix: '/api/v1' });
  server.register(categoryRoutes, { prefix: '/api/v1' });
  server.register(transactionRoutes, { prefix: '/api/v1' });
  server.register(permissionRoutes, { prefix: '/api/v1' });
  server.register(financialRecordRoutes, { prefix: '/api/v1' });
  server.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  server.register(loanRoutes, { prefix: '/api/v1/loans' });
  
  const lineWebhookRoutes = (await import('./routes/lineWebhookRoutes.js')).default;
  server.register(lineWebhookRoutes, { prefix: '/api/webhook/line' });

  const organizationRoutes = (await import('./routes/organization.routes.js')).default;
  server.register(organizationRoutes, { prefix: '/api/v1/organizations' });

  return server;
};

const start = async () => {
  const server = await buildServer();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
