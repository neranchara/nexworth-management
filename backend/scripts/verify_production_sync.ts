import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
    const orgName = 'neranchara';
    const org = await prisma.organization.findFirst({ where: { name: orgName } });
    if (!org) return;

    console.log(`\n=== VERIFICATION FOR: ${org.name} ===\n`);

    const accounts = await prisma.account.findMany({
        where: { organizationId: org.id },
        include: { asset: true, liability: true, transactions: { include: { type: true } } }
    });

    console.log('--- 1. ASSET BALANCE VERIFICATION (Transaction Log vs DB Record) ---');
    console.log(`${'Account Name'.padEnd(25)} | ${'DB Record'.padStart(12)} | ${'Tx Re-calc'.padStart(12)} | ${'Status'}`);
    console.log('-'.repeat(65));

    for (const acc of accounts) {
        const dbBalance = acc.type === 'LIABILITY' ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
        
        // Find Initial Balance record
        const initialRecord = await prisma.financialRecord.findFirst({
            where: { accountId: acc.id },
            orderBy: { date: 'asc' }
        });
        
        const initialAmount = initialRecord?.amount ?? 0;
        const initialDate = initialRecord?.date || new Date(0);

        // Calculate from transactions AFTER or ON initial date
        let recalculatedBalance = initialAmount;
        const txs = acc.transactions.filter(t => new Date(t.date) >= initialDate);

        for (const tx of txs) {
            const behavior = tx.type.behavior;
            let multiplier = 0;
            const isLiability = acc.type === 'LIABILITY';

            if (isLiability) {
                if (['INCOME', 'DEBT', 'LOAN_REPAY', 'INTERNAL_TRANSFER'].includes(behavior)) multiplier = 1;
                else multiplier = -1;
            } else {
                if (['INCOME', 'SAVING', 'INVESTMENT', 'GOAL', 'EMERGENCY', 'GOAL_SAVING', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW'].includes(behavior)) multiplier = 1;
                else multiplier = -1;
            }
            recalculatedBalance += (tx.amount * multiplier);
        }

        const diff = Math.abs(dbBalance - recalculatedBalance);
        const status = diff < 0.01 ? '✅ MATCH' : `❌ DIFF: ${diff.toFixed(2)}`;

        console.log(`${acc.name.padEnd(25)} | ${dbBalance.toLocaleString().padStart(12)} | ${recalculatedBalance.toLocaleString().padStart(12)} | ${status}`);
    }

    console.log('\n--- 2. MONTHLY SUMMARY VERIFICATION (APRIL 2026) ---');
    
    const year = 2026;
    const month = 3; // April
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const allTxs = await prisma.transaction.findMany({
        where: { organizationId: org.id, date: { gte: startDate, lte: endDate } },
        include: { type: true, category: { include: { type: true } } }
    });

    let inc = 0, exp = 0, sav = 0, inv = 0, debt = 0;

    for (const tx of allTxs) {
        const behavior = tx.type.behavior;
        const catName = tx.category?.name;
        
        // Logic to check if it's an internal transfer
        const isInternalTransfer = (behavior === 'INTERNAL_TRANSFER' || catName === 'โอนเข้าภายใน' || catName === 'โอนออกภายใน');
        
        // IF behavior was forced to EXPENSE by our new logic (for non-personal accounts)
        // it will NOT be an internal transfer because behavior is EXPENSE.
        
        if (isInternalTransfer) continue;

        if (behavior === 'INCOME') inc += tx.amount;
        else if (behavior === 'EXPENSE') exp += tx.amount;
        else if (behavior === 'SAVING' || behavior === 'GOAL_SAVING' || behavior === 'EMERGENCY') sav += tx.amount;
        else if (behavior === 'INVESTMENT') inv += tx.amount;
        else if (behavior === 'DEBT') debt += tx.amount;
    }

    console.log(`Transactions found: ${allTxs.length}`);
    console.log(`Income:       ${inc.toLocaleString().padStart(12)}`);
    console.log(`Expense:      ${exp.toLocaleString().padStart(12)}`);
    console.log(`Saving:       ${sav.toLocaleString().padStart(12)}`);
    console.log(`Investment:   ${inv.toLocaleString().padStart(12)}`);
    console.log(`Debt Paid:    ${debt.toLocaleString().padStart(12)}`);

    await prisma.$disconnect();
}

main();
