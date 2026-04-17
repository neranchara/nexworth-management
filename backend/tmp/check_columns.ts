import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function check() {
  try {
    const columns: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'TransactionType'
    `);
    console.log('Columns in TransactionType:', columns);
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
