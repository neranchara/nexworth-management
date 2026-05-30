import { config } from './config/index.js'; // MUST BE FIRST
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRawBody from 'fastify-raw-body';

const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ 
    logger: true,
    ignoreTrailingSlash: true
  });

  // Plugins
  await server.register(fastifyRawBody, {
    field: 'rawBody',
    global: true,
    encoding: 'utf8',
    runFirst: true
  });

  await server.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: config.cors.credentials
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

  // Health Check Route
  server.get('/', async () => {
    return { 
      message: 'Nexworth Bot API is online!',
      status: 'stable',
      version: '3.0.1'
    };
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  // ONLY Bot Routes
  const lineWebhookRoutes = (await import('./routes/lineWebhookRoutes.js')).default;
  await server.register(lineWebhookRoutes, { prefix: '/api/webhook/line' });
  
  const aiRoutes = (await import('./routes/ai.routes.js')).default;
  await server.register(aiRoutes, { prefix: '/api/v1/ai' });

  const organizationRoutes = (await import('./routes/organization.routes.js')).default;
  await server.register(organizationRoutes, { prefix: '/api/v1/organizations' });

  return server;
};

const start = async () => {
  const server = await buildServer();
  const port = config.port;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);

    // Start Discord Bot in parallel
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
