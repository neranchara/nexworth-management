import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Manually read .env.production to be absolutely sure
const envPath = path.resolve(process.cwd(), '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="(.+?)"/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1] : null;

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.production');
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

async function main() {
    console.log(`Target DB Host: ${DATABASE_URL.split('@')[1].split('/')[0]}`);
    
    const orgName = 'neranchara';
    const org = await prisma.organization.findFirst({ where: { name: orgName } });
    
    if (!org) {
        console.error(`Org 'neranchara' not found in this database.`);
        // List all orgs to help debug
        const allOrgs = await prisma.organization.findMany();
        console.log('Available Orgs:', allOrgs.map(o => o.name));
        return;
    }

    console.log(`\n=== SUMMARY FOR ORGANIZATION: ${org.name} (${org.id}) ===\n`);

    const accounts = await prisma.account.findMany({
        where: { organizationId: org.id },
        include: { asset: true, liability: true, bank: true }
    });

    const REAL_ASSET_TYPES = ['BANK', 'STOCK', 'GOLD', 'CASHFLOW', 'EMERGENCY', 'INVESTMENT', 'SAVING', 'FAMILY'];
    
    let totalRealAssets = 0;
    let totalLiabilities = 0;
    
    console.log('--- ACCOUNTS & BALANCES ---');
    for (const acc of accounts) {
        const balance = acc.type === 'LIABILITY' ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
        const shouldInclude = acc.isPersonal || acc.type === 'INVESTMENT';
        
        if (acc.type === 'LIABILITY') {
            totalLiabilities += Math.abs(balance);
        } else if (REAL_ASSET_TYPES.includes(acc.type) && shouldInclude) {
            totalRealAssets += balance;
        }

        console.log(`${acc.name.padEnd(25)} | Type: ${acc.type.padEnd(10)} | Personal: ${acc.isPersonal ? 'YES' : 'NO '} | Balance: ${balance.toLocaleString().padStart(12)} ${!shouldInclude ? '(EXCLUDED)' : ''}`);
    }

    console.log('\n--- DASHBOARD TOTALS ---');
    console.log(`Total Real Assets: ${totalRealAssets.toLocaleString()}`);
    console.log(`Total Liabilities: ${totalLiabilities.toLocaleString()}`);
    console.log(`NET WORTH:        ${(totalRealAssets - totalLiabilities).toLocaleString()}`);

    // Monthly Summary (Current Month: April 2026)
    const year = 2026;
    const month = 3; // April
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
        where: {
            organizationId: org.id,
            date: { gte: startDate, lte: endDate }
        },
        include: { type: true, category: true }
    });

    let inc = 0, exp = 0, sav = 0, inv = 0, debt = 0;

    for (const tx of transactions) {
        const behavior = tx.type.behavior;
        const catName = tx.category?.name;
        const amount = tx.amount;

        const isInternalTransfer = behavior === 'INTERNAL_TRANSFER' || catName === 'โอนเข้าภายใน' || catName === 'โอนออกภายใน';

        if (isInternalTransfer) continue;

        if (behavior === 'INCOME') inc += amount;
        else if (behavior === 'EXPENSE') exp += amount;
        else if (behavior === 'SAVING') sav += amount;
        else if (behavior === 'INVESTMENT') inv += amount;
        else if (behavior === 'DEBT') debt += amount;
        else if (behavior === 'GOAL_SAVING') sav += amount;
    }

    console.log(`\n--- MONTHLY SUMMARY (APRIL 2026) ---`);
    console.log(`Income:       ${inc.toLocaleString().padStart(12)}`);
    console.log(`Expense:      ${exp.toLocaleString().padStart(12)}`);
    console.log(`Saving:       ${sav.toLocaleString().padStart(12)}`);
    console.log(`Investment:   ${inv.toLocaleString().padStart(12)}`);
    console.log(`Debt Paid:    ${debt.toLocaleString().padStart(12)}`);
    console.log(`NET (Surplus): ${(inc - (exp + sav + inv + debt)).toLocaleString().padStart(12)}`);

    await prisma.$disconnect();
}

main();
