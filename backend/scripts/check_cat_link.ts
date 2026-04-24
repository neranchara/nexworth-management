import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const cat = await prisma.transactionCategory.findFirst({
    where: { name: 'คืนเงินภายใน' },
    include: { type: true }
  });
  
  console.log('--- CATEGORY CHECK ---');
  if (cat) {
    console.log(`Category: ${cat.name}`);
    console.log(`Linked to Type: ${cat.type?.name} (Behavior: ${cat.type?.behavior})`);
    console.log(`Type ID: ${cat.typeId}`);
  } else {
    console.log('Category "คืนเงินภายใน" not found.');
  }
  
  await prisma.$disconnect();
}

main();
