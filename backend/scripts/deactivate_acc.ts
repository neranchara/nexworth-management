import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'กรุงเทพ มด' } }
  });
  
  if (acc) {
    await prisma.account.update({
      where: { id: acc.id },
      data: { isActive: false }
    });
    console.log('Successfully deactivated: กรุงเทพ มด');
  } else {
    console.log('Account not found.');
  }
  
  await prisma.$disconnect();
}

main();
