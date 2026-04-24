import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const types = await prisma.transactionType.findMany();
  console.log('--- TRANSACTION TYPES ---');
  types.forEach(t => {
    console.log(`- ${t.name} (Behavior: ${t.behavior}, ID: ${t.id})`);
  });
  
  await prisma.$disconnect();
}

main();
