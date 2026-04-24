import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="(.+?)"/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1] : null;

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL! } } });

async function main() {
    const acc = await prisma.account.findFirst({
        where: { name: { contains: 'ไทยพาณิชย์' } },
        include: { asset: true, financialRecords: true }
    });

    if (!acc) return;

    console.log(`\n=== INVESTIGATING: ${acc.name} ===`);
    console.log(`DB Asset Record Amount: ${acc.asset?.amount}`);
    
    console.log('\n--- Initial Balance Records ---');
    acc.financialRecords.forEach(r => {
        console.log(`Date: ${r.date.toISOString()} | Amount: ${r.amount}`);
    });

    console.log('\n--- Transactions ---');
    const txs = await prisma.transaction.findMany({
        where: { accountId: acc.id },
        include: { type: true, category: true },
        orderBy: { date: 'asc' }
    });

    let running = acc.financialRecords[0]?.amount ?? 0;
    console.log(`START: ${running}`);

    txs.forEach(t => {
        const behavior = t.type.behavior;
        let mult = (['INCOME', 'SAVING', 'INVESTMENT', 'INTERNAL_TRANSFER', 'LOAN_REPAY', 'LOAN_BORROW'].includes(behavior)) ? 1 : -1;
        running += (t.amount * mult);
        console.log(`${t.date.toISOString().split('T')[0]} | ${t.description?.padEnd(20)} | ${behavior.padEnd(10)} | ${t.amount.toLocaleString().padStart(10)} | Running: ${running.toLocaleString().padStart(12)}`);
    });

    await prisma.$disconnect();
}

main();
