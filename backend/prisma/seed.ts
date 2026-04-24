import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { setupOrganizationDefaults } from '../src/services/organization.service.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : 
               process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Cleanup
  console.log('Cleaning up existing data...');
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.transactionCategory.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  
  // 2. Create Master Admin
  console.log('Creating Master Admin...');
  const masterOrg = await prisma.organization.create({
    data: { name: 'System Management' }
  });

  const hashedMasterPassword = await bcrypt.hash('superpassword123', 10);
  const masterAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@nexworth.net',
      passwordHash: hashedMasterPassword,
      firstName: 'System',
      lastName: 'Admin',
      isSystemAdmin: true,
      organizationId: masterOrg.id
    },
  });

  // Setup defaults for Master Org
  await setupOrganizationDefaults(masterOrg.id, masterAdmin.id);

  // 3. Create Default User (neranchara)
  console.log('Creating default user org...');
  const org = await prisma.organization.create({
    data: { name: 'neranchara' }
  });

  const hashedUserPassword = await bcrypt.hash('w,j,uP@ssw0rd', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'neranchara.ksr@gmail.com',
      passwordHash: hashedUserPassword,
      firstName: 'Nexworth',
      lastName: 'Admin',
      organizationId: org.id
    },
  });

  await setupOrganizationDefaults(org.id, admin.id);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
