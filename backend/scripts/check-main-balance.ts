
import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const accountName = 'บัญชีหลัก (กรุงเทพ)';
  
  const account = await prisma.account.findFirst({
    where: { name: accountName },
    include: {
      financialRecords: true,
      asset: true,
      liability: true,
      transactions: {
        include: { type: true, category: true },
        orderBy: { date: 'asc' }
      }
    }
  });

  if (!account) {
    console.log(`Account "${accountName}" not found.`);
    return;
  }

  console.log(`\n=== Account Summary for: ${account.name} ===`);
  console.log(`Account ID: ${account.id}`);
  console.log(`Account Type: ${account.type}`);

  // Get Earliest Financial Record as Starting Point
  const sortedRecords = [...account.financialRecords].sort((a, b) => a.date.getTime() - b.date.getTime());
  const initialRecord = sortedRecords[0];
  const initialAmount = initialRecord ? initialRecord.amount : 0;
  console.log(`Initial Balance (from ${initialRecord ? initialRecord.date.toISOString().split('T')[0] : 'N/A'}): ${initialAmount.toLocaleString()}`);

  let currentSum = initialAmount;
  console.log(`\nTransaction Breakdown:`);
  console.log(`${'Date'.padEnd(12)} | ${'Description'.padEnd(30)} | ${'Amount'.padStart(12)} | ${'Behavior'.padEnd(15)} | ${'Running Balance'.padStart(15)}`);
  console.log('-'.repeat(95));

  for (const tx of account.transactions) {
    const behavior = tx.type.behavior;
    const amount = tx.amount;
    const isLiability = account.type === 'LIABILITY';
    let multiplier = 0;

    if (isLiability) {
      if (['EXPENSE', 'DEBT', 'LOAN_BORROW'].includes(behavior)) {
        multiplier = 1;
      } else if (['INCOME', 'LOAN_REPAY', 'INTERNAL_TRANSFER', 'SAVING_INVESTMENT', 'SAVING', 'INVESTMENT'].includes(behavior)) {
        multiplier = -1;
      }
    } else {
      if (['INCOME', 'SAVING_INVESTMENT', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING'].includes(behavior)) {
        multiplier = 1;
      } else if (['EXPENSE', 'DEBT'].includes(behavior)) {
        multiplier = -1;
      }
    }

    const change = amount * multiplier;
    currentSum += change;

    console.log(`${tx.date.toISOString().split('T')[0].padEnd(12)} | ${tx.description.substring(0, 30).padEnd(30)} | ${change.toLocaleString().padStart(12)} | ${behavior.padEnd(15)} | ${currentSum.toLocaleString().padStart(15)}`);
  }

  console.log('-'.repeat(95));
  console.log(`Final Calculated Balance: ${currentSum.toLocaleString()}`);
  console.log(`Current Balance in DB Account field: ${account.balance?.toLocaleString()}`);
  if (account.asset) console.log(`Current Balance in Asset table: ${account.asset.amount.toLocaleString()}`);
  if (account.liability) console.log(`Current Balance in Liability table: ${account.liability.amount.toLocaleString()}`);
  
  const dbBalance = account.asset?.amount || account.liability?.amount || account.balance || 0;
  console.log(`Difference: ${(dbBalance - currentSum).toLocaleString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
