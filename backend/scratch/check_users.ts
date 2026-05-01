import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      organization: true,
      role: true
    }
  });
  console.log('Total Users:', users.length);
  users.forEach(u => {
    console.log(`- ${u.email} | Org: ${u.organization?.name} | Role: ${u.role?.name} | IsActive: ${u.isActive}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
