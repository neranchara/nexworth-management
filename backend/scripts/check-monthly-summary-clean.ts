
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const currentYear = 2026;
  const transactions = await prisma.transaction.findMany({
    where: { 
      organizationId: '32839490-a7f5-4730-a78f-0923f494bf47',
      date: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1)
      }
    },
    include: { type: true, category: true }
  });

  const monthlyCashflow = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
    saving: 0,
    goalSaving: 0,
    invest: 0,
    debt: 0,
    net: 0,
    records: 0
  }));

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    const mIdx = txDate.getMonth();
    const amount = tx.amount;
    const behavior = tx.type.behavior;
    const categoryName = tx.category?.name;

    const isInternalTransfer = behavior === 'INTERNAL_TRANSFER' || categoryName === 'โอนเข้าภายใน' || categoryName === 'โอนออกภายใน';

    if (!isInternalTransfer) {
      if (behavior === 'INCOME') {
        monthlyCashflow[mIdx].income += amount;
      } else if (behavior === 'LOAN_BORROW') {
        monthlyCashflow[mIdx].income += amount;
      } else if (behavior === 'EXPENSE') {
        monthlyCashflow[mIdx].expense += amount;
      } else if (behavior === 'LOAN_REPAY') {
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
    monthlyCashflow[mIdx].records += 1;
  }

  monthlyCashflow.forEach(m => {
    m.net = m.income - (m.expense + m.debt + m.saving + m.goalSaving + m.invest);
  });

  console.log("Updated Monthly Summary (Aggregated - CLEAN) for 2026:");
  console.table(monthlyCashflow.filter(m => m.records > 0));
}

main().finally(() => prisma.$disconnect());
