export interface MonthlyCashflow {
  month: string;
  income: number;
  expense: number;
  saving: number;
  goalSaving: number;
  invest: number;
  debt: number;
  net: number;
  records: number;
}

export interface GoalTracking {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
}

export interface Stats {
  summary: {
    totalAssets: number;
    totalGoalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpense: number;
    liquidityDangerZone: number;
    liquiditySafeZone: number;
    cashflowStatus: 'DANGER' | 'WATCH' | 'SAFE';
    totalOrganizations?: number;
    totalUsers?: number;
    totalTransactions?: number;
    annualIncome?: number;
    annualExpense?: number;
    annualSaving?: number;
    annualGoalSaving?: number;
    annualInvest?: number;
    annualDebt?: number;
    annualNet?: number;
  };
  currency: string;
  monthlyCashflow: MonthlyCashflow[];
  health: {
    score: number;
    status: string;
    metrics: {
      savingRate: number;
      goalRate: number;
      emergencyMonths: number;
      debtRatio: number;
      investmentRatio: number;
    };
    scores: {
      saving: number;
      emergency: number;
      debt: number;
      investment: number;
    };
  };
  goalTracking: GoalTracking[];
  assetsByAccount?: any[];
  liabilitiesByAccount?: any[];
  isSystemAdmin?: boolean;
  recentOrganizations?: any[];
}
