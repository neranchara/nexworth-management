import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const acc = await prisma.account.findFirst({
    where: { name: { contains: 'ไทยพาณิชย์' } }
  });
  
  if (acc) {
    await prisma.account.update({
      where: { id: acc.id },
      data: { isPersonal: true, type: 'BANK' }
    });
    console.log('Successfully reverted: ไทยพาณิชย์ (isPersonal=true, Type=BANK)');
  } else {
    console.log('Account not found.');
  }
  
  await prisma.$disconnect();
}

main();
