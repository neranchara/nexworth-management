import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_p6yThKgD1CQS@ep-floral-waterfall-aosnkmof.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" } }
});

async function main() {
  const roleId = '1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3';
  const resources = [
    'dashboard', 'transactions', 'assets', 'liabilities', 
    'loan-tracker', 'monthly-summary', 'users', 'roles', 'settings'
  ];

  console.log(`Granting Full Access to Role ID: ${roleId}`);

  for (const res of resources) {
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId, resource: res } },
      update: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
      create: {
        roleId,
        resource: res,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      }
    });
    console.log(`- Granted access to: ${res}`);
  }

  console.log('--- ALL PERMISSIONS GRANTED ---');
  await prisma.$disconnect();
}

main().catch(console.error);
