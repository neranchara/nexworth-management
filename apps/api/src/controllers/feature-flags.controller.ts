import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const DEFAULT_FLAGS = [
  { name: 'ai_slip_scanner',  enabled: true,  description: 'Smart Slip Scanner via OCR + AI' },
  { name: 'goal_tracking',    enabled: true,  description: 'Financial Goals & Allocations' },
  { name: 'loan_tracker',     enabled: true,  description: 'Loan & Debt Tracker' },
  { name: 'line_bot',         enabled: true,  description: 'LINE Bot Integration' },
  { name: 'multi_user_org',   enabled: true,  description: 'Multi-user Organization Support' },
  { name: 'ai_diagnosis',     enabled: true,  description: 'AI Financial Health Diagnosis' },
  { name: 'velocity_chart',   enabled: true,  description: 'Performance Velocity Chart' },
  { name: 'asset_allocation', enabled: true,  description: 'Asset Allocation Doughnut Chart' },
];

export const listFeaturesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const flags = await prisma.featureFlag.findMany({ orderBy: { name: 'asc' } });
    return reply.send({ features: flags });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateFeatureHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string };
    const { name } = request.params as { name: string };
    const { enabled } = request.body as { enabled: boolean };

    const flag = await prisma.featureFlag.upsert({
      where: { name },
      update: { enabled, updatedBy: user.sub },
      create: { name, enabled, updatedBy: user.sub },
    });

    return reply.send({ feature: flag });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const seedDefaultFlagsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { isSystemAdmin?: boolean };
    if (!user.isSystemAdmin) return reply.status(403).send({ error: 'Forbidden' });

    await Promise.all(
      DEFAULT_FLAGS.map(f =>
        prisma.featureFlag.upsert({
          where: { name: f.name },
          update: {},
          create: { name: f.name, enabled: f.enabled, description: f.description },
        })
      )
    );

    const flags = await prisma.featureFlag.findMany({ orderBy: { name: 'asc' } });
    return reply.send({ seeded: flags.length, features: flags });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
