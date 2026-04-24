import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  console.log('--- NEON UPDATE LIVE ---');
  console.log('Targeting:', process.env.DATABASE_URL);
  
  const result = await prisma.account.updateMany({
    where: {
      OR: [
        { name: { startsWith: 'Cloud Pocket' } },
        { name: 'กสิกร โอนภายใน' }
      ]
    },
    data: { accountNumber: '2011874579' }
  });
  
  console.log('Update Result:', result);
  await prisma.$disconnect();
}

main();
