import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, organizationId: true, isSystemAdmin: true }
  });
  console.log('[Users in Neon]');
  console.table(users);
  await prisma.$disconnect();
}

main().catch(console.error);
