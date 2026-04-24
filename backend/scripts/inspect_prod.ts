
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function main() {
  const prodEnv = dotenv.config({ path: path.resolve(process.cwd(), '.env.production') }).parsed;
  if (!prodEnv) {
    console.error("Could not find .env.production");
    return;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: prodEnv.DATABASE_URL
      }
    }
  });

  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { transactions: true, users: true, accounts: true }
        }
      }
    });

    console.log("PRODUCTION Organizations and Counts:");
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

    console.log("\nPRODUCTION Users:");
    console.table(users.map(u => ({
      id: u.id,
      email: u.email,
      orgId: u.organizationId,
      orgName: u.organization?.name
    })));

    const totalTxs = await prisma.transaction.count();

    console.log(`\nTotal PRODUCTION Transactions: ${totalTxs}`);

    if (totalTxs > 0) {
      const samples = await prisma.transaction.findMany({
        take: 10,
        include: { organization: true, account: true, category: true, type: true },
        orderBy: { date: 'desc' }
      });
      console.log("\nRecent PRODUCTION Transactions:");
      console.table(samples.map(s => ({
        id: s.id,
        date: s.date.toISOString().split('T')[0],
        desc: s.description,
        amt: s.amount,
        type: s.type.name,
        cat: s.category.name,
        org: s.organization?.name || 'NULL',
        acc: s.account?.name || 'NULL'
      })));
    }
    const orphanTxs = await prisma.transaction.count({
      where: { organizationId: null }
    });
    console.log(`\nPRODUCTION Transactions without organizationId: ${orphanTxs}`);

    const monthlyStats = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "organizationId" = '2b6b6b0d-44d3-4e88-a7d5-d845efce557b'
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `;
    console.log("\nMonthly Stats for neranchara in PRODUCTION:");
    console.table(monthlyStats);

    const recentlyUpdated = await prisma.transaction.findMany({
      where: {
        organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b'
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { category: true }
    });

    console.log("\nRecently Updated Transactions for neranchara in PRODUCTION:");
    console.table(recentlyUpdated.map(t => ({
      id: t.id,
      desc: t.description,
      amt: t.amount,
      date: t.date.toISOString().split('T')[0],
      updatedAt: t.updatedAt.toISOString(),
      cat: t.category.name
    })));
    const accounts = await prisma.account.findMany({
      include: { organization: true, user: true }
    });
    console.log("\nPRODUCTION Accounts and Organizations:");
    console.table(accounts.map(a => ({
      id: a.id,
      name: a.name,
      org: a.organization?.name || 'NULL',
      user: a.user.email
    })));

    const accountOrgMismatch = accounts.filter(a => a.organizationId !== a.user.organizationId);
    console.log(`\nAccounts with Organization Mismatch (Account vs User): ${accountOrgMismatch.length}`);
    if (accountOrgMismatch.length > 0) {
      console.table(accountOrgMismatch.map(a => ({ id: a.id, accOrg: a.organizationId, userOrg: a.user.organizationId })));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const recentTxs = await prisma.transaction.findMany({
      where: {
        organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b',
        date: { gte: yesterday }
      },
      include: { category: true, type: true, account: true }
    });

    console.log(`\nTransactions from Yesterday (${yesterday.toISOString().split('T')[0]}) to Today: ${recentTxs.length}`);
    if (recentTxs.length > 0) {
      console.table(recentTxs.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        desc: t.description,
        amt: t.amount,
        cat: t.category.name,
        acc: t.account.name
      })));
    }
    const createdRecent = await prisma.transaction.findMany({
      where: {
        organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b',
        createdAt: { gte: yesterday }
      },
      include: { category: true, type: true, account: true }
    });

    console.log(`\nTransactions CREATED since Yesterday (${yesterday.toISOString()}): ${createdRecent.length}`);
    if (createdRecent.length > 0) {
      console.table(createdRecent.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        createdAt: t.createdAt.toISOString(),
        desc: t.description,
        amt: t.amount,
        cat: t.category.name
      })));
    }
    const uob = await prisma.account.findUnique({
      where: { id: 'df799566-4066-4225-b0d4-1db1bdcde60b' },
      include: {
        transactions: { include: { type: true } },
        financialRecords: true,
        liability: true
      }
    });

    if (uob) {
      console.log("\nUOB Account Details:");
      console.log(`Initial: ${uob.financialRecords[0]?.amount || 0}`);
      console.log(`Current Liability Balance: ${uob.liability?.amount}`);
      console.table(uob.transactions.map(t => ({
        desc: t.description,
        amt: t.amount,
        behavior: t.type.behavior,
        date: t.date.toISOString().split('T')[0]
      })));
    }
    const missingAssetLiab = await prisma.loan.findMany({
      where: {
        organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b',
        assetId: null,
        liabilityId: null
      }
    });

    console.log(`\nLoans with MISSING assetId and liabilityId: ${missingAssetLiab.length}`);
    if (missingAssetLiab.length > 0) {
      console.table(missingAssetLiab.map(l => ({ id: l.id, name: l.name, accId: l.accountId })));
    }
    const allAccs = await prisma.account.findMany({
      where: { organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b' },
      include: { asset: true, liability: true }
    });

    console.log(`\nAll Accounts for neranchara: ${allAccs.length}`);
    const orphanAccounts = allAccs.filter(a => !a.asset && !a.liability);
    console.log(`Accounts without Asset OR Liability: ${orphanAccounts.length}`);
    if (orphanAccounts.length > 0) {
        console.table(orphanAccounts.map(a => ({ id: a.id, name: a.name, type: a.type })));
    }
    const totalGlobalAccs = await prisma.account.count();
    console.log(`\nTotal Global Accounts in DB: ${totalGlobalAccs}`);

    const allGlobalOrgs = await prisma.organization.findMany();
    console.log(`Total Global Organizations in DB: ${allGlobalOrgs.length}`);
    console.table(allGlobalOrgs.map(o => ({ id: o.id, name: o.name })));
    const fixedLoans = await prisma.loan.findMany({
      where: {
        organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b',
        OR: [
          { assetId: { not: null } },
          { liabilityId: { not: null } }
        ]
      },
      include: {
        asset: { include: { account: true } },
        liability: { include: { account: true } }
      }
    });

    console.log(`\nFixed Loans in DB: ${fixedLoans.length}`);
    console.table(fixedLoans.map(l => ({
      name: l.name,
      accName: l.asset?.account?.name || l.liability?.account?.name || 'MISSING'
    })));
    const txTypes = await prisma.transactionType.findMany({
      where: { organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b' }
    });
    console.log(`\nTransaction Types for neranchara: ${txTypes.length}`);
    console.table(txTypes.map(t => ({ name: t.name, behavior: t.behavior })));

    const loanTxs = await prisma.transaction.findMany({
      where: { 
        organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b',
        loanId: { not: null }
      },
      include: { type: true, loan: true }
    });
    console.log(`\nTransactions linked to Loans: ${loanTxs.length}`);
    console.table(loanTxs.map(t => ({ 
      id: t.id, 
      loan: t.loan?.name, 
      desc: t.description, 
      amt: t.amount, 
      behavior: t.type?.behavior 
    })));
    const loanCounts = await prisma.loan.groupBy({
      by: ['organizationId'],
      _count: true
    });
    console.log("\nLoan Counts by Organization:");
    console.table(loanCounts);
    const finalAccs = await prisma.account.findMany({
      where: { organizationId: '2b6b6b0d-44d3-4e88-a7d5-d845efce557b' }
    });
    console.log(`\nFinal Accounts for neranchara: ${finalAccs.length}`);
    console.table(finalAccs.map(a => ({ name: a.name })));
    const adminUser = await prisma.user.findUnique({
      where: { email: 'superadmin@nexworth.net' }
    });
    console.log(`\nSuper Admin User: ${adminUser?.email}`);
    console.log(`isSystemAdmin Flag: ${adminUser?.isSystemAdmin}`);
  } finally {
    await prisma.$disconnect();
  }
}
















main();
