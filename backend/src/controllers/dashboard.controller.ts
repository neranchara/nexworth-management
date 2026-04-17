import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const getDashboardStatsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { sub: string, orgId: string };
    const query = request.query as { year?: string };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = query.year ? parseInt(query.year) : now.getFullYear();
    
    // 1. Fetch all accounts and transactions
    const [accountsRaw, transactions] = await Promise.all([
      prisma.account.findMany({ 
        where: { organizationId: user.orgId },
        include: { asset: true, liability: true }
      }),
      prisma.transaction.findMany({ 
        where: { organizationId: user.orgId },
        include: { 
          type: true, 
          category: true,
          account: { select: { type: true } },
          asset: { include: { account: true } },
          liability: { include: { account: true } }
        }
      })
    ]);

    let totalRealAssets = 0;
    let totalGoalAssets = 0;
    let investmentAssets = 0;
    let totalLiabilities = 0;
    let liquidAssets = 0;

    const REAL_ASSET_TYPES = ['BANK', 'STOCK', 'GOLD', 'CASHFLOW', 'EMERGENCY', 'INVESTMENT', 'SAVING', 'FAMILY'];
    const LIQUID_TYPES = ['BANK', 'CASHFLOW', 'SAVING', 'EMERGENCY'];
    const INVESTMENT_TYPES = ['STOCK', 'GOLD', 'INVESTMENT'];

    const assetsByAccount: any[] = [];
    const liabilitiesByAccount: any[] = [];
    const goalTracking: any[] = [];

    accountsRaw.forEach(acc => {
      const balance = acc.type === 'LIABILITY' ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
      
      if (acc.type === 'LIABILITY') {
        const absBalance = Math.abs(balance);
        totalLiabilities += absBalance;
        if (absBalance !== 0) {
          liabilitiesByAccount.push({ id: acc.id, name: acc.name, type: acc.type, balance: absBalance });
        }
      } else if (REAL_ASSET_TYPES.includes(acc.type)) {
        totalRealAssets += balance;
        if (LIQUID_TYPES.includes(acc.type)) liquidAssets += balance;
        if (INVESTMENT_TYPES.includes(acc.type)) investmentAssets += balance;
        if (balance !== 0) {
          assetsByAccount.push({ id: acc.id, name: acc.name, type: acc.type, balance });
        }
      } else if (acc.type === 'GOAL') {
        totalGoalAssets += balance;
        goalTracking.push({ id: acc.id, name: acc.name, balance });
      }
    });

    const netWorth = totalRealAssets - totalLiabilities;

    // 2. Monthly Summary (Jan-Dec) for Current Year
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
      const txDate = new Date(tx.date);
      const amount = tx.amount;
      const behavior = tx.type.behavior;

      // Current Year Cashflow
      if (txDate.getFullYear() === currentYear) {
        const mIdx = txDate.getMonth();
        const accType = tx.account?.type || tx.asset?.account?.type || tx.liability?.account?.type;
        if (!accType) continue; 
        
        const isInvestmentAcc = INVESTMENT_TYPES.includes(accType);
        const isGoalAcc = accType === 'GOAL';

        if (behavior === 'INCOME') {
          monthlyCashflow[mIdx].income += amount;
        } else if (behavior === 'LOAN_BORROW') {
          monthlyCashflow[mIdx].income += amount;
          monthlyCashflow[mIdx].internalLoan += amount;
        } else if (behavior === 'EXPENSE') {
          monthlyCashflow[mIdx].expense += amount;
        } else if (behavior === 'LOAN_REPAY') {
          monthlyCashflow[mIdx].expense += amount;
          monthlyCashflow[mIdx].internalLoan += amount;
        } else if (behavior === 'SAVING') {
          monthlyCashflow[mIdx].saving += amount;
        } else if (behavior === 'INVESTMENT') {
          monthlyCashflow[mIdx].invest += amount;
        } else if (behavior === 'GOAL' || behavior === 'GOAL_SAVING') {
          monthlyCashflow[mIdx].goalSaving += amount;
        } else if (behavior === 'EMERGENCY') {
          monthlyCashflow[mIdx].saving += amount; // นับรวมกับ Savings
        } else if (behavior === 'DEBT') {
          monthlyCashflow[mIdx].debt += amount;
        }
        
        // Track record count for any valid transaction in that month
        monthlyCashflow[mIdx].records += 1;
      }

      // Recent Expenses (Current Month only)
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        if (behavior === 'EXPENSE' || behavior === 'DEBT' || behavior === 'LOAN_REPAY') {
          recentExpenses += amount;
        }
      }
    }

    // Calculate Net (Surplus) for each month
    // Surplus = Income - (Expense + Debt + Saving + GoalSaving + Invest)
    monthlyCashflow.forEach(m => {
      m.net = m.income - (m.expense + m.debt + m.saving + m.goalSaving + m.invest);
    });

    // 3. Calculate Scores and Financial Health Metrics
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
      saving: Math.round(savingScore * 10) / 10,
      emergency: Math.round(emergencyScore * 10) / 10,
      debt: Math.round(debtScore * 10) / 10,
      investment: Math.round(investmentScore * 10) / 10
    };

    const totalHealthScore = Math.round(scores.saving + scores.emergency + scores.debt + scores.investment);
    
    let healthStatus = 'Critical';
    if (totalHealthScore >= 90) healthStatus = 'Excellent';
    else if (totalHealthScore >= 75) healthStatus = 'Very Good';
    else if (totalHealthScore >= 60) healthStatus = 'Good';
    else if (totalHealthScore >= 40) healthStatus = 'Risk';

    return reply.send({
      currency: '฿',
      summary: {
        totalAssets: totalRealAssets,
        totalGoalAssets,
        totalLiabilities,
        netWorth,
        monthlySaving: currentMonthData.saving,
        monthlyIncome: currentMonthData.income,
        monthlyExpense: currentMonthData.expense,
        savingRate: Math.round(savingRate * 1000) / 10,
        goalRate: Math.round(goalRate * 1000) / 10,
        debtRatio: Math.round(debtRatio * 1000) / 10,
        investmentRatio: Math.round(investmentRatio * 1000) / 10,
        emergencyMonths: Math.round(emergencyMonths * 10) / 10
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
      goalTracking
    });

  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
