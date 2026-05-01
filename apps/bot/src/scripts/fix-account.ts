import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accountId = '7dfe44dc-dfae-4ac0-86ee-c1ac0054105e';
  const userId = '280f7c87-569d-4aa4-8a4f-1ef9f10282d1'; // From previous diagnostic
  const orgId = '280e7e80-ff62-4bc3-a126-b34b4021999a';

  console.log(`--- Fixing Account "กรุงเทพ" (ID: ${accountId}) ---`);
  
  const asset = await prisma.asset.upsert({
    where: { accountId },
    update: {},
    create: {
      accountId,
      userId,
      organizationId: orgId,
      amount: 0
    }
  });

  console.log('✅ Asset Link Created Successfully!');
  console.log(JSON.stringify(asset, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
