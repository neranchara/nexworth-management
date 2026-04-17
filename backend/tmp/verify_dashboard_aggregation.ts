import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- DASHBOARD AGGREGATION VERIFICATION ---');
  
  try {
    // We'll call the logic directly or simulate it for a specific user
    // Since we are on staging, we'll pick the main user
    const userEmail = 'neranchara.ksr@gmail.com';
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    
    if (!user) throw new Error('User not found');
    
    const now = new Date();
    const currentYear = now.getFullYear();

    // Fetch transactions for the current year
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1)
        }
      },
      include: { type: true, asset: { include: { account: true } }, liability: { include: { account: true } } }
    });

    console.log(`Transactions for ${currentYear}: ${transactions.length}`);

    // Manual Aggregation for comparison
    const manualAgg = Array.from({ length: 12 }, () => ({
      income: 0, expense: 0, saving: 0, goalSaving: 0, invest: 0, debt: 0, records: 0
    }));

    const INVESTMENT_TYPES = ['STOCK', 'GOLD', 'INVESTMENT'];

    for (const tx of transactions) {
      const mIdx = new Date(tx.date).getMonth();
      const amount = tx.amount;
      const behavior = tx.type.behavior;
      const accType = tx.asset?.account?.type || tx.liability?.account?.type;

      manualAgg[mIdx].records += 1;

      if (behavior === 'INCOME' || behavior === 'LOAN_BORROW') {
        manualAgg[mIdx].income += amount;
      } else if (behavior === 'EXPENSE' || behavior === 'LOAN_REPAY') {
        manualAgg[mIdx].expense += amount;
      } else if (behavior === 'SAVING_INVESTMENT' || behavior === 'GOAL_SAVING') {
        if (behavior === 'GOAL_SAVING' || accType === 'GOAL') manualAgg[mIdx].goalSaving += amount;
        else if (accType && INVESTMENT_TYPES.includes(accType)) manualAgg[mIdx].invest += amount;
        else manualAgg[mIdx].saving += amount;
      } else if (behavior === 'DEBT') {
        manualAgg[mIdx].debt += amount;
      }
    }

    // Print summary for non-empty months
    manualAgg.forEach((m, i) => {
      if (m.records > 0) {
        const monthName = new Date(currentYear, i).toLocaleString('en-US', { month: 'short' });
        const surplus = m.income - (m.expense + m.debt + m.saving + m.goalSaving + m.invest);
        console.log(`${monthName}: Inc:${m.income}, Exp:${m.expense}, Sav:${m.saving}, GSav:${m.goalSaving}, Inv:${m.invest}, Debt:${m.debt}, Rec:${m.records}, Surplus:${surplus}`);
      }
    });

    console.log('--- Verification Complete ---');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
