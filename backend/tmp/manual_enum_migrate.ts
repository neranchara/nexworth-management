import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('--- MANUAL ENUM MIGRATION (RAW SQL VERSION) ---');
    
    // 1. Add new values to Postgres Enum (Raw SQL)
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "TransactionBehavior" ADD VALUE IF NOT EXISTS 'SAVING'`);
      console.log('Added SAVING to enum');
    } catch (e) { console.log('SAVING already exists or error:', (e as any).message); }

    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "TransactionBehavior" ADD VALUE IF NOT EXISTS 'INVESTMENT'`);
      console.log('Added INVESTMENT to enum');
    } catch (e) { console.log('INVESTMENT already exists or error:', (e as any).message); }

    // 2. Identify and Update TransactionTypes via Raw SQL
    const types: any[] = await prisma.$queryRawUnsafe(`
      SELECT t.id, t.name, a.type as "accType"
      FROM "TransactionType" t
      LEFT JOIN "Category" c ON c."typeId" = t.id
      LEFT JOIN "Transaction" tr ON tr."categoryId" = c.id
      LEFT JOIN "Asset" asst ON tr."assetId" = asst.id
      LEFT JOIN "Account" a ON asst."accountId" = a.id
      WHERE t.behavior = 'SAVING_INVESTMENT'
      LIMIT 100
    `);

    console.log(`Found ${types.length} type instances/rows to migrate`);

    for (const type of types) {
      let newBehavior = 'SAVING';
      if (type.accType && ['STOCK', 'GOLD', 'INVESTMENT'].includes(type.accType)) {
        newBehavior = 'INVESTMENT';
      }

      console.log(`Updating type id ${type.id} -> ${newBehavior}`);
      await prisma.$executeRawUnsafe(`UPDATE "TransactionType" SET "behavior" = '${newBehavior}' WHERE "id" = '${type.id}'`);
    }

    // Also update any remaining types that didn't have transactions to provide a hint
    await prisma.$executeRawUnsafe(`UPDATE "TransactionType" SET "behavior" = 'SAVING' WHERE "behavior" = 'SAVING_INVESTMENT'`);

    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
