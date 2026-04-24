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
      data: { type: 'FAMILY', isPersonal: false, isActive: true }
    });
    console.log('Successfully updated: ไทยพาณิชย์ (Type=FAMILY, isPersonal=false)');
  } else {
    console.log('Account not found.');
  }
  
  await prisma.$disconnect();
}

main();
