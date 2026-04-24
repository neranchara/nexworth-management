import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orgs = await prisma.organization.findMany({
        include: {
            _count: {
                select: { transactions: true, accounts: true }
            }
        }
    });

    console.log('--- ORGANIZATIONS IN PRODUCTION ---');
    orgs.forEach(o => {
        console.log(`ID: ${o.id} | Name: ${o.name} | Accounts: ${o._count.accounts} | Transactions: ${o._count.transactions}`);
    });

    await prisma.$disconnect();
}

main();
