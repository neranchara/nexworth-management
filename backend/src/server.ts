import { config } from './config/index.js';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRawBody from 'fastify-raw-body';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ logger: true });

  // Plugins
  await server.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: config.cors.credentials
  });
  await server.register(fastifyJwt, {
    secret: config.jwtSecret
  });
  await server.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true
  });

  const fastifyRateLimit = (await import('@fastify/rate-limit')).default;
  
  await server.register(fastifyRateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    allowList: config.isStaging ? ['127.0.0.1', 'localhost'] : []
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
  const port = config.port;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
