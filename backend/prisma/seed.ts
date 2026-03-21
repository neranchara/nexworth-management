import { PrismaClient } from '../src/generated/client/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'Admin', description: 'All Access Administrator' },
    { name: 'Guest', description: 'Read-only dashboard access' },
    { name: 'Assistant', description: 'Operates on assigned tasks' },
    { name: 'Production User', description: 'Production floor operations' },
    { name: 'Officer', description: 'Financial & invoice operations' },
  ];

  console.log('Start seeding roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded.');

  // Check if Admin exists, if not, create default admin
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  
  if (adminRole) {
    const adminEmail = 'admin@nexworth.local';
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName: 'System',
          lastName: 'Administrator',
          roleId: adminRole.id,
        }
      });
      console.log('Default admin seeded. (admin@nexworth.local / admin123)');
    }
  }

  // Seed Master Banks Wait, let's just make it simple:
  console.log('Start seeding master banks...');
  const banks = [
    { code: 'KBANK', name: 'Kasikornbank', color: '#00A950' },
    { code: 'SCB', name: 'Siam Commercial Bank', color: '#4E2A84' },
    { code: 'BBL', name: 'Bangkok Bank', color: '#1E4598' },
    { code: 'KTB', name: 'Krung Thai Bank', color: '#00A4E4' },
    { code: 'BAY', name: 'Bank of Ayudhya (Krungsri)', color: '#FEC43B' },
  ];

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { code: bank.code },
      update: {},
      create: bank,
    });
  }
  console.log('Banks seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
