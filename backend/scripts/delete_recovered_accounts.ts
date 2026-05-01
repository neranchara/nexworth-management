import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DELETING RECOVERED ACCOUNTS FROM NEON ---');

  const recoveredAccs = await prisma.account.findMany({
    where: { name: { contains: 'Recovered Account' } }
  });

  console.log(`Found ${recoveredAccs.length} recovered accounts to delete.`);

  for (const acc of recoveredAccs) {
    console.log(`Cleaning up account: ${acc.name} (${acc.id})...`);
    
    // 1. Delete Transactions linked to this account
    const txCount = await prisma.transaction.deleteMany({
      where: { accountId: acc.id }
    });
    console.log(`- Deleted ${txCount.count} transactions.`);

    // 2. Delete the Account itself (Prisma cascades Assets/Liabilities if configured, or we do it manually)
    // Based on schema, Asset/Liability are Cascade.
    await prisma.account.delete({
      where: { id: acc.id }
    });
    console.log(`[SUCCESS] Account ${acc.name} removed.`);
  }

  console.log('--- CLEANUP COMPLETED ---');
  await prisma.$disconnect();
}

main().catch(console.error);
