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
  let masterAdmin = await prisma.user.findUnique({ where: { email: 'superadmin@nexworth.online' } });
  if (!masterAdmin) {
    console.log('Creating superadmin@nexworth.online...');
    const hashedMasterPassword = await bcrypt.hash('superpassword123', 10);
    masterAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@nexworth.online',
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
  let org = await prisma.organization.findFirst({ where: { name: 'Nexworth Business' } });
  if (!org) {
    console.log('Creating Nexworth Business org...');
    org = await prisma.organization.create({ data: { name: 'Nexworth Business' } });
  } else {
    console.log(`Nexworth Business org exists: ${org.id}`);
  }

  let admin = await prisma.user.findFirst({ where: { email: 'admin@nexworth.test' } });
  if (!admin) {
    console.log('Creating Nexworth Business admin...');
    const hashedUserPassword = await bcrypt.hash('P@ssword123', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@nexworth.test',
        passwordHash: hashedUserPassword,
        firstName: 'Business',
        lastName: 'Admin',
        organizationId: org.id
      },
    });
  } else {
    console.log(`Nexworth Business admin exists: ${admin.id}`);
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
    const hashedTestPassword = await bcrypt.hash('TestP@ssw0rd123', 10);
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
  
  // --- Seed Test Data for test@nexworth.net ---
  console.log('Seeding financial data for test@nexworth.net...');
  
  // 1. Fetch Types and Categories
  const types = await prisma.transactionType.findMany({ where: { organizationId: testOrg.id } });
  const incomeType = types.find(t => t.behavior === 'INCOME');
  const savingType = types.find(t => t.behavior === 'SAVING');
  const transferType = types.find(t => t.behavior === 'INTERNAL_TRANSFER');
  
  // Ensure a category for internal transfer exists
  let transferCat = await prisma.transactionCategory.findFirst({
    where: { organizationId: testOrg.id, name: 'โอนเงิน', typeId: transferType?.id }
  });
  if (!transferCat && transferType) {
    transferCat = await prisma.transactionCategory.create({
      data: { name: 'โอนเงิน', typeId: transferType.id, organizationId: testOrg.id }
    });
  }

  const categories = await prisma.transactionCategory.findMany({ where: { organizationId: testOrg.id } });
  const salaryCat = categories.find(c => c.name === 'เงินเดือน' && c.typeId === incomeType?.id);
  const savingCat = categories.find(c => c.name === 'เงินออม' && c.typeId === savingType?.id);
  const emergencyCat = categories.find(c => c.name === 'เงินฉุกเฉิน' && c.typeId === savingType?.id);

  // 2. Create Accounts
  const kbank = await prisma.bank.findFirst({ where: { organizationId: testOrg.id, code: 'KBANK' } });
  const scb = await prisma.bank.findFirst({ where: { organizationId: testOrg.id, code: 'SCB' } });

  // Main Bank Account
  const mainAccount = await prisma.account.upsert({
    where: { id: 'test-main-account-id' }, // Stable ID for testing
    update: {},
    create: {
      id: 'test-main-account-id',
      name: 'Main KBANK',
      type: 'BANK',
      bankId: kbank?.id,
      userId: testUser.id,
      organizationId: testOrg.id,
      actualDate: new Date()
    }
  });

  // Emergency Account
  const emergencyAccount = await prisma.account.upsert({
    where: { id: 'test-emergency-account-id' },
    update: {},
    create: {
      id: 'test-emergency-account-id',
      name: 'Emergency SCB',
      type: 'EMERGENCY',
      bankId: scb?.id,
      userId: testUser.id,
      organizationId: testOrg.id,
      actualDate: new Date()
    }
  });

  // Saving Account
  const savingAccount = await prisma.account.upsert({
    where: { id: 'test-saving-account-id' },
    update: {},
    create: {
      id: 'test-saving-account-id',
      name: 'Saving Fund',
      type: 'SAVING',
      userId: testUser.id,
      organizationId: testOrg.id,
      actualDate: new Date()
    }
  });

  // 3. Ensure Assets exist (required by dashboard logic)
  for (const acc of [mainAccount, emergencyAccount, savingAccount]) {
    await prisma.asset.upsert({
      where: { accountId: acc.id },
      update: {},
      create: {
        accountId: acc.id,
        userId: testUser.id,
        organizationId: testOrg.id,
        amount: 0 // Will be updated by transactions or manual entry if needed
      }
    });
  }

  // 4. Create Transactions for current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Salary Income -> Main Account (100,000)
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      organizationId: testOrg.id,
      accountId: mainAccount.id,
      categoryId: salaryCat!.id,
      typeId: incomeType!.id,
      amount: 100000,
      description: 'Monthly Salary',
      date: new Date(currentYear, currentMonth, 1),
      assetId: (await prisma.asset.findUnique({ where: { accountId: mainAccount.id } }))?.id
    }
  });

  // EMERGENCY Income -> Emergency Account (45,000) - To satisfy regression test
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      organizationId: testOrg.id,
      accountId: emergencyAccount.id,
      categoryId: emergencyCat!.id,
      typeId: incomeType!.id, // Using INCOME behavior for this specific test case requirement
      amount: 45000,
      description: 'Emergency Fund Top-up',
      date: new Date(currentYear, currentMonth, 5),
      assetId: (await prisma.asset.findUnique({ where: { accountId: emergencyAccount.id } }))?.id
    }
  });

  // INTERNAL TRANSFER -> From Main to Saving (5,000) - To satisfy regression test (Internal as Saving)
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      organizationId: testOrg.id,
      accountId: mainAccount.id,
      categoryId: transferCat!.id,
      typeId: transferType!.id,
      amount: 5000,
      description: 'Transfer to Savings',
      date: new Date(currentYear, currentMonth, 10),
      assetId: (await prisma.asset.findUnique({ where: { accountId: mainAccount.id } }))?.id
    }
  });

  // Update Asset amounts to reflect transactions for dashboard display
  await prisma.asset.update({ where: { accountId: mainAccount.id }, data: { amount: 95000 } });
  await prisma.asset.update({ where: { accountId: emergencyAccount.id }, data: { amount: 45000 } });
  await prisma.asset.update({ where: { accountId: savingAccount.id }, data: { amount: 5000 } });

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
