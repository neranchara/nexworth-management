import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function check() {
  try {
    const types = await prisma.transactionType.findMany({
      where: { behavior: 'SAVING_INVESTMENT' as any }
    });
    console.log(`Found ${types.length} types with SAVING_INVESTMENT`);
    
    // Check if we can add the new values to the enum first if they don't exist
    // But since we are using db push, we can't easily do partial enum updates
    
    // Alternative: Use RAW SQL to rename or add values if Postgres
    // Postgres doesn't allow dropping enum values easily if used
    
    // Let's try to find if there are any transactions using these types
    const txCount = await prisma.transaction.count({
      where: { type: { behavior: 'SAVING_INVESTMENT' as any } }
    });
    console.log(`Found ${txCount} transactions using these types`);

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
