// READ-ONLY diagnostic script - does not write/modify/delete anything.
// Reconciles each of a user's accounts' stored Asset.amount against a fresh sum of that
// account's Transaction history, and flags likely-duplicate transactions - including
// where each "duplicate" actually transfers to (via linkedTransactionId), so a transfer
// fanned out to several different destination accounts isn't mistaken for a true dupe.
//
// NOTE: only reconciles Asset.amount (not Liability.amount) - liability-type accounts
// (e.g. credit cards) will show "storedBalance: undefined" and a bogus-looking MISMATCH;
// that's a limitation of this script, not a real discrepancy.
//
// Usage:
//   DATABASE_URL="<connection string>" npx tsx src/scripts/audit-account-balances.ts <email> [accountType]
//
// accountType is optional (e.g. CASHFLOW) - omit it to audit every account for that user.
import { prisma, logConnectedDatabase } from '../lib/prisma-script.js';

async function main() {
  await logConnectedDatabase();

  const email = process.argv[2];
  const accountType = process.argv[3];
  if (!email) {
    console.error('Usage: npx tsx src/scripts/audit-account-balances.ts <email> [accountType]');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) { console.log(`User not found: ${email}`); return; }

  const accounts = await prisma.account.findMany({
    where: { organizationId: user.organizationId, ...(accountType ? { type: accountType } : {}) },
    include: { asset: true, bank: true }
  });

  // id -> name, for resolving a duplicate transaction's transfer destination.
  const allAccountsInOrg = await prisma.account.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, type: true }
  });
  const accountNameById = new Map(allAccountsInOrg.map(a => [a.id, `${a.name} (${a.type})`]));

  console.log(`=== Accounts for ${email}${accountType ? ` (type=${accountType})` : ''} ===`);
  console.log('(isPersonal: whether this account counts toward Dashboard Net Worth / Total Assets - see calculateFinancialStats)');
  for (const a of accounts) {
    console.log({ id: a.id, name: a.name, type: a.type, bank: a.bank?.name, isActive: a.isActive, isPersonal: a.isPersonal, storedBalance: a.asset?.amount });
  }

  for (const acc of accounts) {
    console.log(`\n\n========================================`);
    console.log(`=== "${acc.name}" (${acc.id}) ===`);
    console.log(`========================================`);

    const txs = await prisma.transaction.findMany({
      where: { accountId: acc.id },
      include: { type: true, category: true },
      orderBy: { date: 'asc' }
    });
    console.log(`Total transactions: ${txs.length}`);

    let runningBalance = 0;
    const seen = new Map<string, typeof txs>();
    for (const tx of txs) {
      const sign = tx.direction === 'FROM' ? -1 : 1;
      runningBalance += sign * Math.abs(tx.amount);
      const key = `${tx.date.toISOString().slice(0, 10)}|${tx.amount}|${tx.description || ''}`;
      const group = seen.get(key) || [];
      group.push(tx);
      seen.set(key, group);
    }

    const stored = acc.asset?.amount ?? 0;
    console.log(`\nComputed balance from all transactions: ${runningBalance.toFixed(2)}`);
    console.log(`Stored Asset.amount (what the app shows): ${stored.toFixed(2)}`);
    console.log(`Difference: ${(stored - runningBalance).toFixed(2)}  ${Math.abs(stored - runningBalance) > 0.01 ? '<-- MISMATCH!' : '(matches, OK)'}`);

    console.log('\n--- Possible duplicates (same date+amount+description more than once) ---');
    let dupCount = 0;
    for (const [key, group] of seen.entries()) {
      if (group.length > 1) {
        dupCount++;
        console.log(`  x${group.length}:  ${key}`);
        for (const tx of group) {
          const linkedToAccount = tx.linkedTransactionId
            ? await prisma.transaction.findUnique({ where: { id: tx.linkedTransactionId }, select: { accountId: true } })
            : null;
          const destination = linkedToAccount ? (accountNameById.get(linkedToAccount.accountId) ?? linkedToAccount.accountId) : null;
          console.log(`      id=${tx.id}  linkedTransactionId=${tx.linkedTransactionId ?? '(none)'}  ${destination ? `-> transfers to: ${destination}` : '(no linked transaction - likely not a transfer)'}`);
        }
      }
    }
    if (dupCount === 0) console.log('  (none found)');

    console.log('\n--- Largest 15 transactions by absolute amount ---');
    const sorted = [...txs].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 15);
    for (const tx of sorted) {
      console.log({
        date: tx.date.toISOString().slice(0, 10),
        amount: tx.amount,
        direction: tx.direction,
        behavior: tx.type?.behavior,
        category: tx.category?.name,
        description: tx.description,
        linkedTransactionId: tx.linkedTransactionId || null
      });
    }

    console.log('\n--- Monthly totals (income / expense / net) ---');
    const months = new Map<string, { income: number; expense: number }>();
    for (const tx of txs) {
      const monthKey = tx.date.toISOString().slice(0, 7);
      const m = months.get(monthKey) || { income: 0, expense: 0 };
      if (tx.direction === 'FROM') m.expense += Math.abs(tx.amount);
      else m.income += Math.abs(tx.amount);
      months.set(monthKey, m);
    }
    for (const [month, m] of [...months.entries()].sort()) {
      console.log(`  ${month}: income=${m.income.toFixed(2)}  expense=${m.expense.toFixed(2)}  net=${(m.income - m.expense).toFixed(2)}`);
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
