import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'บัญชีเงินซื้อรถ' } }
  });
  
  if (!acc) {
    console.log('Account not found');
    return;
  }

  const type = await prisma.transactionType.findFirst({
    where: { behavior: 'GOAL_SAVING' }
  });
  
  const cat = await prisma.transactionCategory.findFirst({
    where: { name: { contains: 'รายได้อื่น' } }
  });
  
  if (!type || !cat) {
    console.log('Type or Category not found');
    return;
  }

  await prisma.transaction.create({
    data: {
      organizationId: acc.organizationId,
      userId: acc.userId,
      accountId: acc.id,
      typeId: type.id,
      categoryId: cat.id,
      amount: 261032.08,
      date: new Date('2025-12-31'),
      description: 'ยอดยกมาจากปี 2025'
    }
  });

  console.log('Successfully created BF transaction: 261,032.08');
  
  // Also ensure the Asset is correctly set to the target balance
  await prisma.asset.upsert({
    where: { accountId: acc.id },
    update: { amount: 346032.08 },
    create: { 
      accountId: acc.id, 
      amount: 346032.08, 
      userId: acc.userId, 
      organizationId: acc.organizationId 
    }
  });
  
  console.log('Updated Asset Balance to 346,032.08');

  await prisma.$disconnect();
}

main();
