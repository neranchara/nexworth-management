import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const getBenchmarksHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string };
    const settings = await prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        savingRateTarget: true,
        investmentRateTarget: true,
        debtRatioTarget: true,
        emergencyMonthsTarget: true,
      }
    });

    if (!settings) return reply.status(404).send({ error: 'User not found' });

    return reply.send({ benchmarks: settings });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateBenchmarksHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string };
    const body = request.body as {
      savingRateTarget?: number;
      investmentRateTarget?: number;
      debtRatioTarget?: number;
      emergencyMonthsTarget?: number;
    };

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(body.savingRateTarget     !== undefined && { savingRateTarget:     body.savingRateTarget }),
        ...(body.investmentRateTarget !== undefined && { investmentRateTarget: body.investmentRateTarget }),
        ...(body.debtRatioTarget      !== undefined && { debtRatioTarget:      body.debtRatioTarget }),
        ...(body.emergencyMonthsTarget !== undefined && { emergencyMonthsTarget: body.emergencyMonthsTarget }),
      },
      select: {
        savingRateTarget: true,
        investmentRateTarget: true,
        debtRatioTarget: true,
        emergencyMonthsTarget: true,
      }
    });

    return reply.send({ benchmarks: updated });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
