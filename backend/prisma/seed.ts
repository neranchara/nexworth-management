import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { setupOrganizationDefaults } from '../src/services/organization.service.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : 
               process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Idempotent Database Seeding ---');

  // 1. Create Master Org (only if not exists)
  let masterOrg = await prisma.organization.findFirst({ where: { name: 'System Management' } });
  if (!masterOrg) {
    console.log('Creating System Management org...');
    masterOrg = await prisma.organization.create({ data: { name: 'System Management' } });
  } else {
    console.log(`System Management org exists: ${masterOrg.id}`);
  }

  // 2. Create Super Admin (only if not exists)
  let masterAdmin = await prisma.user.findUnique({ where: { email: 'superadmin@nexworth.net' } });
  if (!masterAdmin) {
    console.log('Creating superadmin@nexworth.net...');
    const hashedMasterPassword = await bcrypt.hash('superpassword123', 10);
    masterAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@nexworth.net',
        passwordHash: hashedMasterPassword,
        firstName: 'System',
        lastName: 'Admin',
        isSystemAdmin: true,
        organizationId: masterOrg.id
      },
    });
  } else {
    console.log(`superadmin exists: ${masterAdmin.id}`);
  }

  // Setup defaults for Master Org
  await setupOrganizationDefaults(masterOrg.id, masterAdmin.id);

  // 3. Create Default User Org (only if not exists)
  let org = await prisma.organization.findFirst({ where: { name: 'neranchara' } });
  if (!org) {
    console.log('Creating neranchara org...');
    org = await prisma.organization.create({ data: { name: 'neranchara' } });
  } else {
    console.log(`neranchara org exists: ${org.id}`);
  }

  let admin = await prisma.user.findFirst({ where: { email: 'neranchara.ksr@gmail.com' } });
  if (!admin) {
    console.log('Creating neranchara admin...');
    const hashedUserPassword = await bcrypt.hash('w,j,uP@ssw0rd', 10);
    admin = await prisma.user.create({
      data: {
        email: 'neranchara.ksr@gmail.com',
        passwordHash: hashedUserPassword,
        firstName: 'Nexworth',
        lastName: 'Admin',
        organizationId: org.id
      },
    });
  } else {
    console.log(`neranchara admin exists: ${admin.id}`);
  }

  await setupOrganizationDefaults(org.id, admin.id);

  // 4. Create Dedicated TEST Org (for E2E/Regression)
  let testOrg = await prisma.organization.findFirst({ where: { name: 'Test Environment' } });
  if (!testOrg) {
    console.log('Creating Test Environment org...');
    testOrg = await prisma.organization.create({ data: { name: 'Test Environment' } });
  }

  let testUser = await prisma.user.findFirst({ where: { email: 'test@nexworth.net' } });
  if (!testUser) {
    console.log('Creating test@nexworth.net...');
    const hashedTestPassword = await bcrypt.hash('P@ssword123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@nexworth.net',
        passwordHash: hashedTestPassword,
        firstName: 'Test',
        lastName: 'User',
        organizationId: testOrg.id
      },
    });
  }

  await setupOrganizationDefaults(testOrg.id, testUser.id);

  // 5. Populate specific regression test data for test@nexworth.net
  console.log('Populating regression test data for test@nexworth.net...');
  const testAccounts = await prisma.account.findMany({ where: { userId: testUser.id } });
  const emergencyAcc = testAccounts.find(a => a.type === 'EMERGENCY') || 
                       await prisma.account.create({ data: { name: 'Emergency Fund', type: 'EMERGENCY', userId: testUser.id, organizationId: testOrg.id, bankId: (await prisma.bank.findFirst({ where: { organizationId: testOrg.id } }))?.id || '' } });
  
  const incomeType = await prisma.transactionType.findFirst({ where: { organizationId: testOrg.id, behavior: 'INCOME' } });
  const internalTransferType = await prisma.transactionType.findFirst({ where: { organizationId: testOrg.id, behavior: 'INTERNAL_TRANSFER' } });
  
  const category = await prisma.transactionCategory.findFirst({ where: { organizationId: testOrg.id } });

  // April 2026 transactions
  const aprilDate = new Date('2026-04-15');
  
  // 45,000 Income
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      organizationId: testOrg.id,
      accountId: emergencyAcc.id,
      typeId: incomeType?.id || '',
      categoryId: category?.id || '',
      amount: 45000,
      description: 'Test Income April',
      date: aprilDate
    }
  });

  // 5,000 Internal Transfer
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      organizationId: testOrg.id,
      accountId: emergencyAcc.id,
      typeId: internalTransferType?.id || '',
      categoryId: category?.id || '',
      amount: 5000,
      description: 'Test Internal Transfer',
      date: aprilDate
    }
  });

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
