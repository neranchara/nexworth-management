import { prisma } from '../lib/prisma.js';

async function main() {
  const byDir = await prisma.loan.groupBy({
    by: ['organizationId', 'direction'],
    _count: { _all: true },
  });
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

  console.log('=== Loan counts by org / direction ===');
  for (const row of byDir) {
    console.log({
      org: orgMap[row.organizationId || ''] || row.organizationId,
      direction: row.direction,
      count: row._count._all,
    });
  }

  const loans = await prisma.loan.findMany({
    include: {
      transactions: { include: { type: true, category: { include: { type: true } } } },
      organization: { select: { name: true } },
    },
  });

  console.log('\n=== Per-loan balance check (behavior match) ===');
  for (const loan of loans) {
    const dir = loan.direction || 'BORROW';
    const primary = dir === 'LEND' ? 'LEND_OUT' : 'LOAN_BORROW';
    const secondary = dir === 'LEND' ? 'LEND_REPAY' : 'LOAN_REPAY';
    let lent = 0;
    let repaid = 0;
    const behaviors: string[] = [];
    for (const tx of loan.transactions) {
      const b = (tx.type?.behavior || tx.category?.type?.behavior || '?') as string;
      behaviors.push(b);
      if (b === primary) lent += tx.amount;
      if (b === secondary) repaid += tx.amount;
    }
    const balance = lent - repaid;
    const wouldHideAsPending = balance <= 0;
    if (loan.transactions.length === 0 || wouldHideAsPending || behaviors.some((b) => b !== primary && b !== secondary && b !== '?')) {
      console.log({
        org: loan.organization?.name,
        name: loan.name,
        direction: dir,
        txCount: loan.transactions.length,
        behaviors: [...new Set(behaviors)],
        lent,
        repaid,
        balance,
        hiddenByDefaultPendingFilter: wouldHideAsPending,
      });
    }
  }

  const lendSys = await prisma.transactionCategory.count({ where: { systemKey: 'LEND_OUT_SYS' } });
  const borrowSys = await prisma.transactionCategory.count({ where: { systemKey: 'LOAN_BORROW_SYS' } });
  console.log('\n=== System categories ===', { LEND_OUT_SYS: lendSys, LOAN_BORROW_SYS: borrowSys });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
