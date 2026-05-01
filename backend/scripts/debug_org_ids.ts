import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('[All Organizations in Neon]');
  console.table(orgs);
  await prisma.$disconnect();
}

main().catch(console.error);
