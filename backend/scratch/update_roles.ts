import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({
    where: { name: 'System Management' }
  });

  if (org) {
    const result = await prisma.role.updateMany({
      where: { organizationId: org.id },
      data: { isSystemRole: true }
    });
    console.log(`Updated ${result.count} existing roles in System Management to be System Roles`);
  } else {
    console.log('System Management organization not found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
