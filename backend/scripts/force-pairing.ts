
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { pairingCode: 'LINK-TEST' }
  });
  console.log(`Updated user ${user.email} with pairing code: LINK-TEST`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
