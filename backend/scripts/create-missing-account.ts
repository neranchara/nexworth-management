import { PrismaClient, AccountType } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const userId = '6bbffd14-9ff7-4ac7-85eb-24f8b29122e0';
  const orgId = 'de39aa64-853c-4878-9557-190ffa970f68';

  const account = await prisma.account.create({
    data: {
      name: 'Cloud Pocket ทำบุญ',
      type: AccountType.GOAL,
      userId: userId,
      organizationId: orgId,
      balance: 0,
      isActive: true
    }
  });

  console.log('Created account:', account.name, account.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
