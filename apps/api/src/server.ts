import { config } from './config/index'; // MUST BE FIRST
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRawBody from 'fastify-raw-body';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import transactionRoutes from './routes/transaction.routes';
import { impersonationGuard } from './middlewares/impersonation.middleware';

const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ logger: true });

  await server.register(fastifyRawBody, {
    field: 'rawBody',
    global: true, // Let's make it global to be safe for now
    encoding: 'utf8',
    runFirst: true
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

  // Global Impersonation Guard (Read-only enforcement)
  server.addHook('preHandler', impersonationGuard);

  // Health Check Route
    server.get('/', async () => {
      return { 
        message: 'Nexworth API is online!',
        status: 'stable',
        version: '3.0.1'
      };
    });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

    // API Routes
    await server.register(authRoutes, { prefix: '/api/v1/auth' });
    await server.register(userRoutes, { prefix: '/api/v1' });
    
    const bankRoutes = (await import('./routes/bank.routes')).default;
    const accountRoutes = (await import('./routes/account.routes')).default;
    const categoryRoutes = (await import('./routes/category.routes')).default;
    
    const dashboardRoutes = (await import('./routes/dashboard.routes')).default;
    const { loanRoutes } = await import('./routes/loan.routes');
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
    
    const aiRoutes = (await import('./routes/ai.routes')).default;
    await server.register(aiRoutes, { prefix: '/api/v1/ai' });
  
    const organizationRoutes = (await import('./routes/organization.routes')).default;
    await server.register(organizationRoutes, { prefix: '/api/v1/organizations' });

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

start();
