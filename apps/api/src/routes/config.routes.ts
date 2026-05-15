import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export default async function configRoutes(server: FastifyInstance) {
  server.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * Fetch system configurations for dropdowns and settings.
   */
  server.get('/configs', async (request, reply) => {
    reply.header('Content-Type', 'application/json; charset=utf-8');
    const { category, key } = request.query as { category?: string; key?: string };
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (key) {
      where.key = key;
    }
    
    const configs = await prisma.systemConfig.findMany({
      where
    });

    if (configs.length > 0) {
      console.log(`[CONFIG] Key: ${configs[0].key}, First Value Label: ${JSON.stringify((configs[0].value as any)?.[0]?.label)}`);
    }
    
    return { data: configs };
  });
}
