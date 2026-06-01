import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { REAL_ASSET_TYPES, LIQUID_TYPES, INVESTMENT_TYPES } from '../constants/accountTypes.js';
import { SYSTEM_ADMIN_EMAIL, SYSTEM_ORG_NAME } from '../constants/systemConfig.js';
import { SYSTEM_CATEGORY_KEYS, getCashflowBucket } from '../constants/transactionConfig.js';

export const getDashboardStatsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, organizationId: string, email: string, isSystemAdmin?: boolean, orgName?: string };
    request.log.info({ user: user.email, orgId: user.organizationId }, '🚀 [DEBUG] Dashboard Stats Request Received!');
    const query = request.query as { year?: string, month?: string };
    
    const isSystemAdmin = user.isSystemAdmin || user.email === SYSTEM_ADMIN_EMAIL || user.orgName === SYSTEM_ORG_NAME;

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
      select: {
        liquidityDangerZone: true,
        liquiditySafeZone: true,
        savingRateTarget: true,
        investmentRateTarget: true,
        debtRatioTarget: true,
        emergencyMonthsTarget: true,
      }
    });

    const stats = await calculateFinancialStats(user.organizationId, query.year, query.month, userSettings as UserSettings | null);
    return reply.send(stats);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

interface UserSettings {
  liquidityDangerZone: number;
  liquiditySafeZone: number;
  savingRateTarget: number;
  investmentRateTarget: number;
  debtRatioTarget: number;
  emergencyMonthsTarget: number;
}

async function calculateFinancialStats(
  organizationId: string,
  yearStr?: string,
  monthStr?: string,
  userSettings?: UserSettings | null
) {
  const now = new Date();
  const currentYear = yearStr ? parseInt(yearStr) : now.getFullYear();
  const currentMonth = monthStr !== undefined ? parseInt(monthStr) : now.getMonth();
  
  const [accountsRaw, transactions, goalsRaw, configRecord] = await Promise.all([
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
    }),
    prisma.systemConfig.findUnique({
      where: { key: 'ACCOUNT_TYPES' }
    })
  ]);

  const accountTypesMetadata = (configRecord?.value as any) || [];

  let totalRealAssets = 0;
  let totalGoalTarget = 0;
  let totalGoalCollected = 0;
  let investmentAssets = 0;
  let totalLiabilities = 0;
  let liquidAssets = 0;

  const assetsByAccount: any[] = [];
  const liabilitiesByAccount: any[] = [];
  const goalTracking: any[] = [];

  const getTypeMeta = (type: string) => {
    return accountTypesMetadata.find((t: any) => t.value === type);
  };

  accountsRaw.forEach(acc => {
    const typeMeta = getTypeMeta(acc.type);
    const isLiability = typeMeta?.category === 'LIABILITY' || acc.type === 'LIABILITY';

    let balance = isLiability ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
    
    // Absolute threshold validation to convert negative zero (-0) into exact positive 0
    if (Math.abs(balance) < 0.005) {
      balance = 0;
    }
    
    const isAsset = typeMeta ? typeMeta.category === 'ASSET' : REAL_ASSET_TYPES.includes(acc.type);
    const isLiquid = typeMeta ? (typeMeta.subCategory === 'LIQUID' || typeMeta.subCategory === 'EMERGENCY' || typeMeta.subCategory === 'GOAL') : LIQUID_TYPES.includes(acc.type);
    const isInvestment = typeMeta ? typeMeta.subCategory === 'INVESTMENT' : INVESTMENT_TYPES.includes(acc.type);

    const shouldIncludeInNetWorth = acc.isPersonal || isInvestment;

    if (isLiability) {
      const absBalance = Math.abs(balance);
      totalLiabilities += absBalance;
      if (absBalance !== 0) {
        liabilitiesByAccount.push({ id: acc.id, name: acc.name, type: acc.type, balance: absBalance });
      }
    } else if (isAsset && shouldIncludeInNetWorth) {
      totalRealAssets += balance;
      if (isLiquid) liquidAssets += balance;
      if (isInvestment) investmentAssets += balance;
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
      const catSystemKey = tx.category?.systemKey;
      const isInternalTransfer = behavior === 'INTERNAL_TRANSFER'
        || catSystemKey === SYSTEM_CATEGORY_KEYS.TRANSFER_IN
        || catSystemKey === SYSTEM_CATEGORY_KEYS.TRANSFER_OUT;

      // Use DB cashflowBucket if available, fallback to getCashflowBucket()
      const bucket = getCashflowBucket(behavior, tx.type.cashflowBucket);

      if (!isInternalTransfer) {
        if (bucket === 'income') monthlyCashflow[mIdx].income += amount;
        else if (bucket === 'expense') monthlyCashflow[mIdx].expense += amount;
      }

      if (bucket === 'loan') {
        monthlyCashflow[mIdx].internalLoan += amount;
      }

      if (accType === 'GOAL' || bucket === 'saving' && behavior === 'GOAL_SAVING') {
        monthlyCashflow[mIdx].goalSaving += amount;
      } else if (INVESTMENT_TYPES.includes(accType) || bucket === 'invest') {
        monthlyCashflow[mIdx].invest += amount;
      } else if (accType === 'LIABILITY' || bucket === 'debt') {
        monthlyCashflow[mIdx].debt += amount;
      } else if (accType === 'SAVING' || accType === 'EMERGENCY' || bucket === 'saving') {
        if (isInternalTransfer || bucket === 'saving') {
          monthlyCashflow[mIdx].saving += amount;
        }
      }
      monthlyCashflow[mIdx].records += 1;
    }

    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      const catSysKey = tx.category?.systemKey;
      const isInternalTransfer = behavior === 'INTERNAL_TRANSFER'
        || catSysKey === SYSTEM_CATEGORY_KEYS.TRANSFER_IN
        || catSysKey === SYSTEM_CATEGORY_KEYS.TRANSFER_OUT;
      const bucket2 = getCashflowBucket(behavior, tx.type.cashflowBucket);
      if (!isInternalTransfer && (bucket2 === 'expense' || bucket2 === 'debt' || bucket2 === 'loan')) {
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

  const savingTarget     = userSettings?.savingRateTarget     ?? 0.20;
  const investTarget     = userSettings?.investmentRateTarget  ?? 0.15;
  const debtTarget       = userSettings?.debtRatioTarget       ?? 0.30;
  const emergencyTarget  = userSettings?.emergencyMonthsTarget ?? 6.0;

  const currentMonthData = monthlyCashflow[currentMonth];
  const savingRate = currentMonthData.income > 0 ? (currentMonthData.saving / currentMonthData.income) : 0;
  const savingScore = Math.min(25, (savingRate / savingTarget) * 25);
  const goalRate = currentMonthData.income > 0 ? (currentMonthData.goalSaving / currentMonthData.income) : 0;

  const avgExpense = monthlyCashflow.reduce((sum, m) => sum + m.expense, 0) / (currentMonth + 1);
  const effectiveExpense = avgExpense || recentExpenses || 1;
  const emergencyMonths = liquidAssets / effectiveExpense;
  const emergencyScore = Math.min(25, (emergencyMonths / emergencyTarget) * 25);

  const debtRatio = totalRealAssets > 0 ? (totalLiabilities / totalRealAssets) : (totalLiabilities > 0 ? 1 : 0);
  const debtScore = Math.max(0, 25 * (1 - (debtRatio / debtTarget)));

  const globalInvestRatio = totalRealAssets > 0 ? (investmentAssets / totalRealAssets) : 0;
  const monthlyInvestRatio = currentMonthData.income > 0 ? (currentMonthData.invest / currentMonthData.income) : 0;
  const investmentRatio = (globalInvestRatio * 0.7) + (monthlyInvestRatio * 0.3);
  const investmentScore = Math.min(25, (investmentRatio / investTarget) * 25);

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
      benchmarks: {
        savingRateTarget:     savingTarget,
        investmentRateTarget: investTarget,
        debtRatioTarget:      debtTarget,
        emergencyMonthsTarget: emergencyTarget,
      },
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
    
    const userSettings = await prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        liquidityDangerZone: true,
        liquiditySafeZone: true,
        savingRateTarget: true,
        investmentRateTarget: true,
        debtRatioTarget: true,
        emergencyMonthsTarget: true,
      }
    });

    const stats = await calculateFinancialStats(user.organizationId, query.year, query.month, userSettings as UserSettings | null);
    
    return reply.send(stats);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
