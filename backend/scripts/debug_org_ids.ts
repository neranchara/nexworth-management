import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_p6yThKgD1CQS@ep-floral-waterfall-aosnkmof.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" } }
});

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('[All Organizations in Neon]');
  console.table(orgs);
  await prisma.$disconnect();
}

main().catch(console.error);
