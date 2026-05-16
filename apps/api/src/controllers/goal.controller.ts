import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  color: z.enum(['Emerald', 'Rose', 'Blue', 'Orange']),
  priority: z.enum(['SECURITY', 'SHORT_TERM', 'LONG_TERM', 'NORMAL']),
  deadline: z.string().datetime().nullable().optional(),
  accountId: z.string().uuid().optional(),
});

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  color: z.enum(['Emerald', 'Rose', 'Blue', 'Orange']).optional(),
  priority: z.enum(['SECURITY', 'SHORT_TERM', 'LONG_TERM', 'NORMAL']).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  deadline: z.string().datetime().nullable().optional(),
});

export const listGoalsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    
    const goals = await prisma.goal.findMany({
      where: { organizationId: user.organizationId },
      include: {
        allocations: {
          include: { asset: { include: { account: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedGoals = goals.map(goal => {
      let currentAmount = 0;
      goal.allocations.forEach(alloc => {
        // Here we could either use alloc.allocatedAmount or query real-time. 
        // For now, if allocatedAmount is tracking the mapped balance:
        // Actually, if mapped M:M, the user defines the allocation. Let's sum allocatedAmount.
        currentAmount += alloc.allocatedAmount;
      });

      return {
        ...goal,
        currentAmount,
        progressPercentage: goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0
      };
    });

    return reply.send({ goals: parsedGoals });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getGoalsSummaryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    
    const goals = await prisma.goal.findMany({
      where: { organizationId: user.organizationId, status: 'ACTIVE' },
      include: { allocations: true }
    });

    let totalGoalsValue = 0;
    let totalCollected = 0;
    const goalCount = goals.length;

    goals.forEach(goal => {
      totalGoalsValue += goal.targetAmount;
      goal.allocations.forEach(alloc => {
        totalCollected += alloc.allocatedAmount;
      });
    });

    const overallProgress = totalGoalsValue > 0 ? (totalCollected / totalGoalsValue) * 100 : 0;

    // AI Forecasting Engine (Calculate Monthly Savings Rate from Snapshots)
    const recentSnapshots = await prisma.monthlyFinancialSnapshot.findMany({
      where: { userId: user.sub },
      orderBy: { monthYear: 'desc' },
      take: 6
    });

    let avgMonthlySavings = 0;
    if (recentSnapshots.length > 0) {
      const sumSavings = recentSnapshots.reduce((acc, snap) => acc + snap.savingsRate, 0);
      avgMonthlySavings = sumSavings / recentSnapshots.length;
    } else {
      // Fallback: raw transaction aggregation
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentIncome = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          organizationId: user.organizationId,
          date: { gte: threeMonthsAgo },
          type: { behavior: 'INCOME' }
        }
      });

      const recentExpense = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          organizationId: user.organizationId,
          date: { gte: threeMonthsAgo },
          type: { behavior: 'EXPENSE' }
        }
      });

      const inc = recentIncome._sum.amount || 0;
      const exp = recentExpense._sum.amount || 0;
      avgMonthlySavings = Math.max(0, (inc - exp) / 3);
    }

    // AI Insight logic remains same...
    let forecastMonths = 0;
    let insightMessage = "คุณบรรลุเป้าหมายที่ตั้งไว้ทั้งหมดแล้ว!";
    let behindSchedule = false;

    if (totalGoalsValue > totalCollected) {
      if (avgMonthlySavings > 0) {
        forecastMonths = Math.ceil((totalGoalsValue - totalCollected) / avgMonthlySavings);
        insightMessage = `ด้วยอัตราออมเฉลี่ย ฿${Math.round(avgMonthlySavings).toLocaleString()}/เดือน คุณจะบรรลุเป้าหมายที่เหลือในอีก ${forecastMonths} เดือน`;
      } else {
        insightMessage = `อัตราการออมปัจจุบันไม่เพียงพอ แนะนำให้ปรับเพิ่มรายได้หรือลดรายจ่ายเพื่อบรรลุเป้าหมาย`;
        behindSchedule = true;
      }
    }

    return reply.send({
      summary: {
        totalGoalsValue,
        totalCollected,
        overallProgress,
        goalCount,
        forecastMonths,
        avgMonthlySavings,
        insightMessage,
        behindSchedule
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createGoalHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const body = createGoalSchema.parse(request.body);
    
    const newGoal = await prisma.goal.create({
      data: {
        userId: user.sub,
        organizationId: user.organizationId,
        name: body.name,
        targetAmount: body.targetAmount,
        color: body.color,
        priority: body.priority,
        deadline: body.deadline ? new Date(body.deadline) : null,
      }
    });

    if (body.accountId) {
      const asset = await prisma.asset.findUnique({
        where: { accountId: body.accountId }
      });
      
      if (asset) {
        await prisma.goalAllocation.create({
          data: {
            goalId: newGoal.id,
            assetId: asset.id,
            allocatedAmount: asset.amount // Initial allocation of current balance
          }
        });
      }
    }

    return reply.status(201).send({ message: 'Goal created successfully', goal: newGoal });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateGoalHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };
    const body = updateGoalSchema.parse(request.body);

    const updatedGoal = await prisma.goal.updateMany({
      where: { id, organizationId: user.organizationId },
      data: {
        name: body.name,
        targetAmount: body.targetAmount,
        color: body.color,
        priority: body.priority,
        status: body.status,
        deadline: body.deadline !== undefined ? (body.deadline ? new Date(body.deadline) : null) : undefined,
      }
    });

    if (updatedGoal.count === 0) {
      return reply.status(404).send({ error: 'Goal not found' });
    }

    return reply.send({ message: 'Goal updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: error.format() });
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteGoalHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const { id } = request.params as { id: string };

    const deleted = await prisma.goal.deleteMany({
      where: { id, organizationId: user.organizationId }
    });

    if (deleted.count === 0) {
      return reply.status(404).send({ error: 'Goal not found' });
    }

    return reply.send({ message: 'Goal deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
