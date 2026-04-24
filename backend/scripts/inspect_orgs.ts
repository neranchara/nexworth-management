
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: { transactions: true, users: true, accounts: true }
      }
    }
  });

  console.log("Organizations and Counts:");
  console.table(orgs.map(o => ({
    id: o.id,
    name: o.name,
    txCount: o._count.transactions,
    userCount: o._count.users,
    accountCount: o._count.accounts
  })));

  const users = await prisma.user.findMany({
    include: { organization: true }
  });

  console.log("\nUsers:");
  console.table(users.map(u => ({
    id: u.id,
    email: u.email,
    orgId: u.organizationId,
    orgName: u.organization?.name
  })));

  // Check for transactions without organizationId
  const orphanTxs = await prisma.transaction.count({
    where: { organizationId: null }
  });
  console.log(`\nTransactions without organizationId: ${orphanTxs}`);

  const d = new Date('2026-04-23');
  const recentStaging = await prisma.transaction.findMany({
    where: { date: { gte: d } },
    include: { organization: true, account: true }
  });
  console.log(`\nStaging Transactions since 2026-04-23: ${recentStaging.length}`);
  if (recentStaging.length > 0) {
    console.table(recentStaging.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      desc: t.description,
      amt: t.amount,
      org: t.organization?.name || 'NULL',
      acc: t.account?.name || 'NULL'
    })));
  }
}

main().finally(() => prisma.$disconnect());




