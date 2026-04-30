import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_p6yThKgD1CQS@ep-floral-waterfall-aosnkmof.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" } }
});

async function main() {
  const orgId = '32839490-a7f5-4730-a78f-0923f494bf47';
  console.log(`Targeting Org ID: ${orgId}`);

  try {
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Administrator with full access',
        organizationId: orgId
      }
    });
    console.log('Admin Role created:', adminRole.id);

    // If success, update the user to use this role
    await prisma.user.update({
      where: { email: 'neranchara.ksr@gmail.com' },
      data: { roleId: adminRole.id }
    });
    console.log('User neranchara.ksr@gmail.com updated to Admin role.');

  } catch (e: any) {
    console.error('FAILED TO CREATE ROLE:', e.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
