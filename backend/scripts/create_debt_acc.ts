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

  // Create the "Money Lent" account
  const acc = await prisma.account.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      name: 'เงินให้ยืม: มดสร้างบ้าน',
      type: 'INVESTMENT',
      isPersonal: true,
      isActive: true
    }
  });

  // Create the Asset entry for the 100k
  await prisma.asset.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      accountId: acc.id,
      amount: 100000.00
    }
  });

  console.log('Successfully created Loan Asset: 100,000.00');
  
  await prisma.$disconnect();
}

main();
