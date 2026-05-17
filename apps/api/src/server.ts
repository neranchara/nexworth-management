import { config } from './config/index'; // MUST BE FIRST
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRawBody from 'fastify-raw-body';
import multipart from '@fastify/multipart';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import transactionRoutes from './routes/transaction.routes';
import { impersonationGuard } from './middlewares/impersonation.middleware';
import { performanceRequestHook, performanceResponseHook } from './middlewares/performance.middleware';
import { contextRequestHook } from './middlewares/context.middleware';

export const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ logger: true });

  await server.register(fastifyRawBody, {
    field: 'rawBody',
    global: true,
    encoding: 'utf8', // Ensure raw body is UTF-8
    runFirst: true
  });
  
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  });

  await server.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: config.cors.credentials,
    preflightContinue: false, // Let the plugin handle the response
    preflight: true
  });

  await server.register(fastifyJwt, {
    secret: config.jwtSecret
  });

  const fastifyRateLimit = (await import('@fastify/rate-limit')).default;
  
  await server.register(fastifyRateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    allowList: config.isStaging ? ['127.0.0.1', 'localhost'] : []
  });

  // Global Context & Performance Interceptors
  server.addHook('onRequest', contextRequestHook);
  server.addHook('onRequest', performanceRequestHook);
  server.addHook('onResponse', performanceResponseHook);


  // Global Impersonation Guard (Read-only enforcement)
  server.addHook('preHandler', impersonationGuard);

  // Health Check Route
    server.get('/', async () => {
      return { 
        message: 'Nexworth API is online!',
        status: 'stable',
        version: '3.2.0'
      };
    });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  // ISP Policy: Global UTF-8 Enforcement for Thai Language Support
  server.addHook('onSend', async (request, reply, payload) => {
    const contentType = reply.getHeader('content-type') as string;
    if (contentType && contentType.includes('application/json') && !contentType.includes('charset')) {
      reply.header('content-type', 'application/json; charset=utf-8');
    }
    return payload;
  });

  server.get('/api/v1/debug-encoding', async (request, reply) => {
    const { prisma } = await import('./lib/prisma');
    const configs = await prisma.systemConfig.findMany({
      where: { category: 'DROPDOWNS' }
    });
    const banks = await prisma.bank.findMany({ take: 3 });
    return reply
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ configs, banks });
  });

    // API Routes
    await server.register(authRoutes, { prefix: '/api/v1/auth' });
    await server.register(userRoutes, { prefix: '/api/v1' });
    
    const bankRoutes = (await import('./routes/bank.routes')).default;
    const accountRoutes = (await import('./routes/account.routes')).default;
    const categoryRoutes = (await import('./routes/category.routes')).default;
    
    const dashboardRoutes = (await import('./routes/dashboard.routes')).default;
    const { loanRoutes } = await import('./routes/loan.routes');
    const { goalRoutes } = await import('./routes/goal.routes');
    const typeRoutes = (await import('./routes/type.routes')).default;
    const permissionRoutes = (await import('./routes/permission.routes')).default;
  
    const financialRecordRoutes = (await import('./routes/financial-record.routes')).default;
    const { alertRoutes } = await import('./routes/alert.routes');
  
    await server.register(bankRoutes, { prefix: '/api/v1' });
    await server.register(accountRoutes, { prefix: '/api/v1' });
    await server.register(typeRoutes, { prefix: '/api/v1' });
    await server.register(categoryRoutes, { prefix: '/api/v1' });
    await server.register(transactionRoutes, { prefix: '/api/v1' });
    await server.register(permissionRoutes, { prefix: '/api/v1' });
    await server.register(financialRecordRoutes, { prefix: '/api/v1' });
    await server.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
    await server.register(loanRoutes, { prefix: '/api/v1/loans' });
    await server.register(goalRoutes, { prefix: '/api/v1/goals' });
    
    const aiRoutes = (await import('./routes/ai.routes')).default;
    await server.register(aiRoutes, { prefix: '/api/v1/ai' });
  
    const organizationRoutes = (await import('./routes/organization.routes')).default;
    await server.register(organizationRoutes, { prefix: '/api/v1/organizations' });

    const invitationRoutes = (await import('./routes/invitation.routes')).default;
    await server.register(invitationRoutes, { prefix: '/api/v1/invitations' });

    const configRoutes = (await import('./routes/config.routes')).default;
    await server.register(configRoutes, { prefix: '/api/v1' });

    // Admin Routes (New Gen Nexworth Support Tools)
    const adminRoutes = (await import('./routes/admin.routes')).default;
    await server.register(adminRoutes, { prefix: '/api/v1/admin' });
    await server.register(alertRoutes, { prefix: '/api/v1/admin/alerts' });

  return server;
};

const start = async () => {
  const server = await buildServer();
  const port = config.port;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);

    // Start Discord Bot ONLY in local and ONLY if this is the bot service
    // (We will handle this in apps/bot/src/server.ts instead)
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Using process.argv to detect if the file is being executed directly
import { fileURLToPath } from 'url';
// @ts-ignore
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start();
}
