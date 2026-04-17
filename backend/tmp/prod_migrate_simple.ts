import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('--- PRODUCTION MIGRATION (FIXED SYNTAX) ---');
    
    // 1. Add new enum values if they don't exist
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "TransactionBehavior" ADD VALUE 'SAVING'`);
      console.log('Added SAVING');
    } catch (e) { console.log('SAVING check:', (e as any).message); }

    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "TransactionBehavior" ADD VALUE 'INVESTMENT'`);
      console.log('Added INVESTMENT');
    } catch (e) { console.log('INVESTMENT check:', (e as any).message); }

    // 2. Simple Updates 
    console.log('Updating behaviors in TransactionType...');
    
    // Use heuristic for Investment
    const updateInvestCount = await prisma.$executeRawUnsafe(`
      UPDATE "TransactionType" 
      SET "behavior" = 'INVESTMENT' 
      WHERE "behavior" = 'SAVING_INVESTMENT' 
      AND ("name" ILIKE '%ลงทุน%' OR "name" ILIKE '%หุ้น%' OR "name" ILIKE '%Gold%' OR "name" ILIKE '%Investment%')
    `);
    console.log(`Updated ${updateInvestCount} investment types`);

    const updateSavingCount = await prisma.$executeRawUnsafe(`
      UPDATE "TransactionType" 
      SET "behavior" = 'SAVING' 
      WHERE "behavior" = 'SAVING_INVESTMENT'
    `);
    console.log(`Updated ${updateSavingCount} saving types`);

    console.log('Production migration complete');
  } catch (error) {
    console.error('Production migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
