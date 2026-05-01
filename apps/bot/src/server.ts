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
  server.get('/', async () => {
    return { 
      message: 'Nexworth API is online!',
      status: 'stable',
      version: '2.6.0-PRO'
    };
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  // ONLY Bot Routes
  const lineWebhookRoutes = (await import('./routes/lineWebhookRoutes.js')).default;
  server.register(lineWebhookRoutes, { prefix: '/api/webhook/line' });
  
  const lineWebhookRoutes = (await import('./routes/lineWebhookRoutes.js')).default;
  server.register(lineWebhookRoutes, { prefix: '/api/webhook/line' });

  const aiRoutes = (await import('./routes/ai.routes.js')).default;
  server.register(aiRoutes, { prefix: '/api/v1/ai' });

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

    // Start Discord Bot in parallel (don't await so server can finish starting)
    // ALWAYS Start Discord Bot for this service
    console.log('--- Starting Discord Agent Bot (Bot Service Mode) ---');
    import('./services/discordBot.js').catch(err => {
      console.error('Failed to start Discord Bot:', err);
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
