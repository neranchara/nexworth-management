import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'test-admin@nexworth.net';
  console.log(`--- Checking Accounts for ${email} ---`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        include: {
          asset: true,
          liability: true,
          bank: true
        }
      },
      organization: true
    }
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log(`Organization: ${user.organization?.name} (${user.organizationId})`);
  console.log(`Total Accounts: ${user.accounts.length}`);
  
  user.accounts.forEach(acc => {
    console.log(`- [${acc.id}] Name: "${acc.name}", Type: ${acc.type}, Bank: ${acc.bank?.name || 'N/A'}`);
    console.log(`  Asset: ${acc.asset ? '✅ Connected' : '❌ MISSING'}`);
    console.log(`  Liability: ${acc.liability ? '✅ Connected' : '❌ MISSING'}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
