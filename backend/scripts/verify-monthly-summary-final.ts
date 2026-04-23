
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

const INVESTMENT_TYPES = ['STOCK', 'GOLD', 'INVESTMENT'];

async function main() {
  const currentYear = 2026;
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`),
      },
    },
    include: {
      type: true,
      category: true,
      account: true,
      asset: { include: { account: true } },
      liability: { include: { account: true } },
    },
  });

  const monthlyCashflow = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(currentYear, i).toLocaleString('en-US', { month: 'short' }),
    income: 0,
    expense: 0,
    saving: 0,
    goalSaving: 0,
    invest: 0,
    debt: 0,
    net: 0
  }));

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    const amount = tx.amount;
    const behavior = tx.type.behavior;
    const categoryName = tx.category?.name || "";
    const mIdx = txDate.getMonth();

    const accType = tx.account?.type || tx.asset?.account?.type || tx.liability?.account?.type;
    if (!accType) continue;

    const isInvestmentAcc = INVESTMENT_TYPES.includes(accType);
    const isGoalAcc = accType === 'GOAL';
    const isInternalTransfer = behavior === 'INTERNAL_TRANSFER' || categoryName.includes('โอนเข้าภายใน') || categoryName.includes('โอนออกภายใน');

    if (isInternalTransfer) {
      if (isGoalAcc && (behavior === 'INCOME' || behavior === 'GOAL_SAVING' || behavior === 'GOAL')) {
        monthlyCashflow[mIdx].goalSaving += amount;
      } else if (isInvestmentAcc && (behavior === 'INCOME' || behavior === 'INVESTMENT')) {
        monthlyCashflow[mIdx].invest += amount;
      }
    } else {
      if (behavior === 'INCOME' || behavior === 'LOAN_BORROW') {
        monthlyCashflow[mIdx].income += amount;
      } else if (behavior === 'EXPENSE' || behavior === 'LOAN_REPAY') {
        monthlyCashflow[mIdx].expense += amount;
      } else if (behavior === 'SAVING' || behavior === 'EMERGENCY') {
        monthlyCashflow[mIdx].saving += amount;
      } else if (behavior === 'INVESTMENT') {
        monthlyCashflow[mIdx].invest += amount;
      } else if (behavior === 'GOAL' || behavior === 'GOAL_SAVING') {
        monthlyCashflow[mIdx].goalSaving += amount;
      } else if (behavior === 'DEBT') {
        monthlyCashflow[mIdx].debt += amount;
      }
    }
  }

  monthlyCashflow.forEach(m => {
    m.net = m.income - (m.expense + m.debt + m.saving + m.goalSaving + m.invest);
  });

  console.log("Monthly Summary (Aggregated) 2026 Verification:");
  console.table(monthlyCashflow.filter(m => m.income > 0 || m.expense > 0));
}

main().finally(() => prisma.$disconnect());
