import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { REAL_ASSET_TYPES, LIQUID_TYPES, INVESTMENT_TYPES } from '../constants/accountTypes.js';

export const getDashboardStatsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string, email: string, isSystemAdmin?: boolean, orgName?: string };
    request.log.info({ user: user.email, orgId: user.organizationId }, '🚀 [DEBUG] Dashboard Stats Request Received!');
    const query = request.query as { year?: string, month?: string };
    
    const isSystemAdmin = user.isSystemAdmin || user.email === 'superadmin@nexworth.cc' || user.orgName === 'System Management';

    if (isSystemAdmin) {
      // ---------------------------------------------------------
      // System Admin Dashboard Data
      // ---------------------------------------------------------
      const [orgCount, userCount, transactionCount, recentOrgs] = await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.organization.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, createdAt: true, _count: { select: { users: true } } }
        })
      ]);

      return reply.send({
        isSystemAdmin: true,
        summary: {
          totalOrganizations: orgCount,
          totalUsers: userCount,
          totalTransactions: transactionCount
        },
        recentOrganizations: recentOrgs
      });
    }

    const userSettings = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { liquidityDangerZone: true, liquiditySafeZone: true }
    });

    const stats = await calculateFinancialStats(user.organizationId, query.year, query.month, userSettings);
    return reply.send(stats);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

/**
 * Shared calculation engine for financial metrics
 */
async function calculateFinancialStats(
  organizationId: string, 
  yearStr?: string, 
  monthStr?: string,
  userSettings?: { liquidityDangerZone: number, liquiditySafeZone: number } | null
) {
  const now = new Date();
  const currentYear = yearStr ? parseInt(yearStr) : now.getFullYear();
  const currentMonth = monthStr !== undefined ? parseInt(monthStr) : now.getMonth();
  
  const [accountsRaw, transactions, goalsRaw] = await Promise.all([
    prisma.account.findMany({ 
      where: { organizationId },
      include: { asset: true, liability: true }
    }),
    prisma.transaction.findMany({ 
      where: { organizationId },
      include: { 
        type: true, 
        category: true,
        account: { select: { type: true } },
        asset: { include: { account: true } },
        liability: { include: { account: true } }
      }
    }),
    prisma.goal.findMany({
      where: { organizationId },
      include: { allocations: true }
    })
  ]);

  let totalRealAssets = 0;
  let totalGoalTarget = 0;
  let totalGoalCollected = 0;
  let investmentAssets = 0;
  let totalLiabilities = 0;
  let liquidAssets = 0;


  const assetsByAccount: any[] = [];
  const liabilitiesByAccount: any[] = [];
  const goalTracking: any[] = [];

  accountsRaw.forEach(acc => {
    let balance = acc.type === 'LIABILITY' ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
    
    // Absolute threshold validation to convert negative zero (-0) into exact positive 0
    if (Math.abs(balance) < 0.005) {
      balance = 0;
    }
    
    const shouldIncludeInNetWorth = acc.isPersonal || acc.type === 'INVESTMENT';

    if (acc.type === 'LIABILITY') {
      const absBalance = Math.abs(balance);
      totalLiabilities += absBalance;
      if (absBalance !== 0) {
        liabilitiesByAccount.push({ id: acc.id, name: acc.name, type: acc.type, balance: absBalance });
      }
    } else if (REAL_ASSET_TYPES.includes(acc.type) && shouldIncludeInNetWorth) {
      totalRealAssets += balance;
      if (LIQUID_TYPES.includes(acc.type)) liquidAssets += balance;
      if (INVESTMENT_TYPES.includes(acc.type)) investmentAssets += balance;
      if (balance !== 0) {
        assetsByAccount.push({ id: acc.id, name: acc.name, type: acc.type, tag: acc.tag, balance });
      }
    }
  });

  // Calculate Goals Progress
  goalsRaw.forEach(goal => {
    let collected = 0;
    goal.allocations.forEach((alloc: any) => {
      collected += alloc.allocatedAmount;
    });

    totalGoalTarget += goal.targetAmount;
    totalGoalCollected += collected;

    if (goal.status === 'ACTIVE') {
      goalTracking.push({
        id: goal.id,
        name: goal.name,
        currentAmount: collected,
        targetAmount: goal.targetAmount,
        percentage: goal.targetAmount > 0 ? (collected / goal.targetAmount) * 100 : 0,
        color: goal.color
      });
    }
  });

  // Dynamic fallback for Goal type Accounts if no target-based Goals exist
  if (goalTracking.length === 0) {
    accountsRaw.forEach(acc => {
      if (acc.type === 'GOAL') {
        const balance = acc.asset?.amount ?? 0;
        const target = acc.targetAmount || balance || 1;
        goalTracking.push({
          id: acc.id,
          name: acc.name,
          currentAmount: balance,
          targetAmount: target,
          percentage: target > 0 ? (balance / target) * 100 : 0,
          color: 'Blue'
        });
      }
    });
  }

  const netWorth = totalRealAssets - totalLiabilities;

  const monthlyCashflow = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(currentYear, i).toLocaleString('en-US', { month: 'short' }),
    income: 0,
    expense: 0,
    saving: 0,
    goalSaving: 0,
    invest: 0,
    internalLoan: 0,
    debt: 0,
    net: 0,
    records: 0
  }));

  let recentExpenses = 0;

  for (const tx of transactions) {
    if (!tx.type) continue;
    const txDate = new Date(tx.date);
    const amount = tx.amount;
    const behavior = tx.type.behavior;
    const categoryName = tx.category?.name;

    if (txDate.getFullYear() === currentYear) {
      const mIdx = txDate.getMonth();
      const accType = tx.account?.type || tx.asset?.account?.type || tx.liability?.account?.type || 'UNKNOWN';
      const isInternalTransfer = behavior === 'INTERNAL_TRANSFER' || categoryName?.includes('โอน');
      
      if (!isInternalTransfer) {
        if (behavior === 'INCOME') monthlyCashflow[mIdx].income += amount;
        else if (behavior === 'EXPENSE') monthlyCashflow[mIdx].expense += amount;
      }

      if (behavior === 'LOAN_BORROW' || behavior === 'LOAN_REPAY') {
        monthlyCashflow[mIdx].internalLoan += amount;
      }

      if (accType === 'GOAL' || behavior === 'GOAL_SAVING') {
        monthlyCashflow[mIdx].goalSaving += amount;
      } else if (INVESTMENT_TYPES.includes(accType) || behavior === 'INVESTMENT') {
        monthlyCashflow[mIdx].invest += amount;
      } else if (accType === 'LIABILITY' || behavior === 'DEBT') {
        monthlyCashflow[mIdx].debt += amount;
      } else if (accType === 'SAVING' || accType === 'EMERGENCY' || behavior === 'SAVING' || behavior === 'EMERGENCY') {
        if (isInternalTransfer || behavior === 'SAVING' || behavior === 'EMERGENCY') {
          monthlyCashflow[mIdx].saving += amount;
        }
      }
      monthlyCashflow[mIdx].records += 1;
    }

    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      const isInternalTransfer = behavior === 'INTERNAL_TRANSFER' || categoryName === 'โอนเข้าภายใน' || categoryName === 'โอนออกภายใน';
      if (!isInternalTransfer && (behavior === 'EXPENSE' || behavior === 'DEBT' || behavior === 'LOAN_REPAY')) {
        recentExpenses += amount;
      }
    }
  }

  monthlyCashflow.forEach(m => {
    m.net = m.income - (m.expense + m.debt + m.saving + m.goalSaving + m.invest);
  });

  const annualStats = monthlyCashflow.reduce((acc, m) => ({
    income: acc.income + m.income,
    expense: acc.expense + m.expense,
    saving: acc.saving + m.saving,
    goalSaving: acc.goalSaving + m.goalSaving,
    invest: acc.invest + m.invest,
    debt: acc.debt + m.debt,
    net: acc.net + m.net
  }), { income: 0, expense: 0, saving: 0, goalSaving: 0, invest: 0, debt: 0, net: 0 });

  const currentMonthData = monthlyCashflow[currentMonth];
  const savingRate = currentMonthData.income > 0 ? (currentMonthData.saving / currentMonthData.income) : 0;
  const savingScore = Math.min(25, (savingRate / 0.2) * 25);
  const goalRate = currentMonthData.income > 0 ? (currentMonthData.goalSaving / currentMonthData.income) : 0;

  const avgExpense = monthlyCashflow.reduce((sum, m) => sum + m.expense, 0) / (currentMonth + 1);
  const effectiveExpense = avgExpense || recentExpenses || 1;
  const emergencyMonths = liquidAssets / effectiveExpense;
  const emergencyScore = Math.min(25, (emergencyMonths / 6) * 25);

  const debtRatio = totalRealAssets > 0 ? (totalLiabilities / totalRealAssets) : (totalLiabilities > 0 ? 1 : 0);
  const debtScore = Math.max(0, 25 * (1 - (debtRatio / 0.3)));

  const globalInvestRatio = totalRealAssets > 0 ? (investmentAssets / totalRealAssets) : 0;
  const monthlyInvestRatio = currentMonthData.income > 0 ? (currentMonthData.invest / currentMonthData.income) : 0;
  const investmentRatio = (globalInvestRatio * 0.7) + (monthlyInvestRatio * 0.3);
  const investmentScore = Math.min(25, (investmentRatio / 0.2) * 25);

  const scores = {
    saving: Number.isFinite(savingScore) ? Math.round(savingScore * 10) / 10 : 0,
    emergency: Number.isFinite(emergencyScore) ? Math.round(emergencyScore * 10) / 10 : 0,
    debt: Number.isFinite(debtScore) ? Math.round(debtScore * 10) / 10 : 0,
    investment: Number.isFinite(investmentScore) ? Math.round(investmentScore * 10) / 10 : 0
  };

  const totalHealthScore = Math.round(scores.saving + scores.emergency + scores.debt + scores.investment) || 0;
  
  let healthStatus = 'Critical';
  if (totalHealthScore >= 90) healthStatus = 'Excellent';
  else if (totalHealthScore >= 75) healthStatus = 'Very Good';
  else if (totalHealthScore >= 60) healthStatus = 'Good';
  else if (totalHealthScore >= 40) healthStatus = 'Risk';

  const dangerZone = userSettings?.liquidityDangerZone ?? 30000;
  const safeZone = userSettings?.liquiditySafeZone ?? 70000;

  const cashflowAccounts = accountsRaw
    .filter(acc => acc.tag === 'Cashflow')
    .map(acc => {
      let balance = acc.type === 'LIABILITY' ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
      if (Math.abs(balance) < 0.005) {
        balance = 0;
      }
      return {
        id: acc.id,
        name: acc.name,
        balance,
        status: balance <= dangerZone ? 'DANGER' as const
          : balance >= safeZone ? 'SAFE' as const
          : 'WATCH' as const
      };
    });

  return {
    currency: '฿',
    summary: {
      totalAssets: totalRealAssets,
      totalGoalAssets: totalGoalCollected,
      totalGoalTarget,
      totalLiabilities,
      netWorth,
      monthlySaving: currentMonthData.saving,
      monthlyIncome: currentMonthData.income,
      monthlyExpense: currentMonthData.expense,
      liquidityDangerZone: dangerZone,
      liquiditySafeZone: safeZone,
      cashflowStatus: (currentMonthData.income - currentMonthData.expense) <= dangerZone
        ? 'DANGER'
        : (currentMonthData.income - currentMonthData.expense) >= safeZone
          ? 'SAFE'
          : 'WATCH',
      savingRate: Number.isFinite(savingRate) ? Math.round(savingRate * 1000) / 10 : 0,
      goalRate: Number.isFinite(goalRate) ? Math.round(goalRate * 1000) / 10 : 0,
      debtRatio: Number.isFinite(debtRatio) ? Math.round(debtRatio * 1000) / 10 : 0,
      investmentRatio: Number.isFinite(investmentRatio) ? Math.round(investmentRatio * 1000) / 10 : 0,
      emergencyMonths: Number.isFinite(emergencyMonths) ? Math.round(emergencyMonths * 10) / 10 : 0,
      annualIncome: annualStats.income,
      annualExpense: annualStats.expense,
      annualSaving: annualStats.saving,
      annualGoalSaving: annualStats.goalSaving,
      annualInvest: annualStats.invest,
      annualDebt: annualStats.debt,
      annualNet: annualStats.net
    },
    health: {
      score: totalHealthScore,
      status: healthStatus,
      metrics: {
        savingRate,
        goalRate,
        emergencyMonths: Math.round(emergencyMonths * 100) / 100,
        debtRatio,
        investmentRatio
      },
      scores
    },
    monthlyCashflow,
    assetsByAccount,
    liabilitiesByAccount,
    cashflowAccounts,
    goalTracking
  };
}

/**
 * NEX-901: Summary Aggregator Pattern (Cockpit Handler)
 * Optimized for high-speed delivery of all 5 financial pillars in a single parallel query.
 */
export const getDashboardCockpitHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string };
    const query = request.query as { year?: string, month?: string };
    
    // Fetch user settings for liquidity thresholds
    const userSettings = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { liquidityDangerZone: true, liquiditySafeZone: true }
    });

    // Aggregator Pattern: Use shared calculation engine
    const stats = await calculateFinancialStats(user.organizationId, query.year, query.month, userSettings);
    
    return reply.send(stats);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
