import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst();
  console.log('USER_ID:', user?.id);
  await prisma.$disconnect();
}
main();
