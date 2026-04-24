import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });
  
  const prisma = new PrismaClient();
  
  console.log('--- SERVER DATA CHECK ---');
  console.log('DB URL:', process.env.DATABASE_URL);
  
  const user = await prisma.user.findFirst({
    where: { email: 'neranchara.ksr@gmail.com' },
    include: { organization: true }
  });
  
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log(`User: ${user.firstName} ${user.lastName} (Org: ${user.organization?.name}, OrgID: ${user.organizationId})`);
  
  const accounts = await prisma.account.findMany({
    where: { organizationId: user.organizationId },
  });
  
  console.log(`Found ${accounts.length} accounts for this org.`);
  accounts.forEach(a => {
    console.log(`- ${a.name}: ${a.accountNumber}`);
  });
  
  await prisma.$disconnect();
}

main();
