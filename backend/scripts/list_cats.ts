import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const cats = await prisma.transactionCategory.findMany({
    include: { type: true }
  });
  
  console.log('--- AVAILABLE CATEGORIES ---');
  cats.forEach(c => {
    console.log(`- ${c.name} (Type Behavior: ${c.type?.behavior || 'N/A'})`);
  });
  
  await prisma.$disconnect();
}

main();
