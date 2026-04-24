import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="(.+?)"/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1] : null;

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL! } } });

async function main() {
    const org = await prisma.organization.findFirst({ where: { name: 'neranchara' } });
    if (!org) return;

    const accounts = await prisma.account.findMany({
        where: { organizationId: org.id },
        include: { asset: true, liability: true, bank: true }
    });

    console.log(`\n=== ACTIVE ACCOUNTS IN ASSETS MANAGEMENT UI ===`);
    console.log(`${'Name'.padEnd(25)} | ${'Type'.padEnd(10)} | ${'Active'.padEnd(6)} | ${'Personal'.padEnd(8)} | ${'Balance'.padStart(12)}`);
    console.log('-'.repeat(75));

    for (const acc of accounts) {
        if (!acc.isActive) continue; // Skip inactive
        
        const balance = acc.type === 'LIABILITY' ? (acc.liability?.amount ?? 0) : (acc.asset?.amount ?? 0);
        console.log(`${acc.name.padEnd(25)} | ${acc.type.padEnd(10)} | ${acc.isActive ? 'YES' : 'NO '} | ${acc.isPersonal ? 'YES' : 'NO '} | ${balance.toLocaleString().padStart(12)}`);
    }

    await prisma.$disconnect();
}

main();
