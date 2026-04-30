const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: { in: ['admin@nexworth.test', 'superadmin@nexworth.online'] }
      },
      select: {
        email: true,
        role: true,
        isSystemAdmin: true,
        organization: { select: { name: true } }
      }
    });
    console.log('Users in DB:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
