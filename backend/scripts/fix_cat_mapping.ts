import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const user = await prisma.user.findFirst({
    where: { email: 'neranchara.ksr@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }

  // Find all TransactionTypes with name 'คืนเงินภายใน'
  const types = await prisma.transactionType.findMany({
    where: { name: 'คืนเงินภายใน' }
  });

  console.log(`Found ${types.length} transaction types named "คืนเงินภายใน"`);

  for (const t of types) {
    // Check if category exists for this type
    const exists = await prisma.transactionCategory.findFirst({
      where: { 
        name: 'คืนเงินภายใน',
        typeId: t.id
      }
    });

    if (!exists) {
      await prisma.transactionCategory.create({
        data: {
          organizationId: user.organizationId,
          typeId: t.id,
          name: 'คืนเงินภายใน'
        }
      });
      console.log(`Created "คืนเงินภายใน" category for Type ID: ${t.id}`);
    } else {
      console.log(`Category already exists for Type ID: ${t.id}`);
    }
  }

  console.log('Finished fixing category mapping.');
  
  await prisma.$disconnect();
}

main();
