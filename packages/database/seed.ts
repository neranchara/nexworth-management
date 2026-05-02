import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'local';
const envFile = `.env.${nodeEnv}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const prisma = new PrismaClient();

async function setupOrganizationDefaults(orgId: string, adminUserId: string) {
  // 1. Roles
  const roleNames = ['Admin', 'Production User', 'Officer', 'Guest'];
  const roles: any = {};
  
  for (const roleName of roleNames) {
    roles[roleName] = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: orgId, name: roleName } },
      update: {},
      create: { name: roleName, organizationId: orgId },
    });
  }

  // 2. Assign Admin User to Admin Role
  await prisma.user.update({
    where: { id: adminUserId },
    data: { roleId: roles['Admin'].id }
  });

  // 3. Seed Permissions for each role
  const resources = [
    'dashboard', 'users', 'transactions', 'permissions', 'monthly', 
    'loan-tracker', 'liabilities', 'assets', 'accounts', 'banks', 
    'types', 'categories'
  ];

  for (const resource of resources) {
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles['Admin'].id, resource } },
      update: {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      },
      create: {
        roleId: roles['Admin'].id,
        resource,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      }
    });

    const managementResources = ['users', 'permissions', 'accounts', 'banks', 'types', 'categories'];
    for (const roleName of ['Production User', 'Officer', 'Guest']) {
       const canView = !managementResources.includes(resource);
       await prisma.permission.upsert({
        where: { roleId_resource: { roleId: roles[roleName].id, resource } },
        update: { canView },
        create: {
          roleId: roles[roleName].id,
          resource,
          canView
        }
      });
    }
  }

  // 4. Seed Banks for the Organization
  const initialBanks = [
    { name: 'ธนาคารกรุงเทพ', code: 'BBL' },
    { name: 'ธนาคารไทยพาณิชย์', code: 'SCB' },
    { name: 'ธนาคารกสิกรไทย', code: 'KBANK' },
    { name: 'ธนาคารกรุงไทย', code: 'KTB' },
    { name: 'ธนาคารออมสิน', code: 'GSB' },
    { name: 'เกียรตินาคินภัทร', code: 'KKP' },
    { name: 'ธนาคารยูโอบี', code: 'UOB' },
  ];
  for (const bank of initialBanks) {
    await prisma.bank.upsert({
      where: { organizationId_code: { organizationId: orgId, code: bank.code } },
      update: { name: bank.name },
      create: { name: bank.name, code: bank.code, organizationId: orgId }
    });
  }

  // 5. Seed Transaction Types for the Organization
  const typeData = [
    { name: 'รายรับ', behavior: 'INCOME' },
    { name: 'รายจ่าย', behavior: 'EXPENSE' },
    { name: 'ออม/ลงทุน', behavior: 'SAVING' },
    { name: 'โอนภายใน', behavior: 'INTERNAL_TRANSFER' },
    { name: 'หนี้', behavior: 'DEBT' },
    { name: 'ยืมเงินภายใน', behavior: 'LOAN_BORROW' },
    { name: 'คืนเงินภายใน', behavior: 'LOAN_REPAY' },
    { name: 'เงินมีเป้าหมาย', behavior: 'GOAL_SAVING' },
  ];
  for (const t of typeData) {
    await prisma.transactionType.upsert({
      where: { organizationId_name: { organizationId: orgId, name: t.name } },
      update: { behavior: t.behavior as any },
      create: { name: t.name, behavior: t.behavior as any, organizationId: orgId }
    });
  }

  // 6. Seed Categories for the Organization
  const seededTypes = await prisma.transactionType.findMany({ where: { organizationId: orgId } });
  const getTypeId = (name: string) => seededTypes.find(t => t.name === name)?.id;
  const getTypeByBehavior = (behavior: string) => seededTypes.find(t => t.behavior === behavior)?.id;

  const categoryData = [
    { name: 'เงินเดือน', typeName: 'รายรับ' },
    { name: 'รายได้อื่น', typeName: 'รายรับ' },
    { name: 'ค่าใช้จ่ายประจำ', typeName: 'รายจ่าย' },
    { name: 'ค่าใช้จ่ายส่วนตัว', typeName: 'รายจ่าย' },
    { name: 'ครอบครัว', typeName: 'รายจ่าย' },
    { name: 'ท่องเที่ยว', typeName: 'ออม/ลงทุน' },
    { name: 'ค่าใช้จ่ายรถ', typeName: 'ออม/ลงทุน' },
    { name: 'บริจาค', typeName: 'ออม/ลงทุน' },
    { name: 'เงินออม', typeName: 'ออม/ลงทุน' },
    { name: 'เงินฉุกเฉิน', typeName: 'ออม/ลงทุน' },
    { name: 'เงินซื้อรถ', typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนหุ้น', typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนทอง', typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนธุรกิจ', typeName: 'ออม/ลงทุน' },
    { name: 'ชำระหนี้', typeName: 'หนี้' },
    { name: 'ยืมเงิน', typeBehavior: 'LOAN_BORROW' },
    { name: 'คืนเงิน', typeBehavior: 'LOAN_REPAY' }
  ];

  for (const cat of categoryData) {
    const typeId = cat.typeName ? getTypeId(cat.typeName) : getTypeByBehavior(cat.typeBehavior!);
    if (typeId) {
      await prisma.transactionCategory.upsert({
        where: { organizationId_name_typeId: { organizationId: orgId, name: cat.name, typeId } },
        update: {},
        create: { name: cat.name, typeId, organizationId: orgId }
      });
    }
  }
}

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

  // --- NEW: Add test-admin@nexworth.net for Regression Tests ---
  let testAdmin = await prisma.user.findFirst({ where: { email: 'test-admin@nexworth.net' } });
  if (!testAdmin) {
    console.log('Creating test-admin@nexworth.net...');
    const hashedAdminPassword = await bcrypt.hash('P@ssword123', 10);
    testAdmin = await prisma.user.create({
      data: {
        email: 'test-admin@nexworth.net',
        passwordHash: hashedAdminPassword,
        firstName: 'Test',
        lastName: 'Admin',
        organizationId: testOrg.id
      },
    });
  }

  await setupOrganizationDefaults(testOrg.id, testUser.id);
  await setupOrganizationDefaults(testOrg.id, testAdmin.id);
  
  // --- Seed Test Data for BOTH test users ---
  for (const currentUser of [testUser, testAdmin]) {
    console.log(`Seeding financial data for ${currentUser.email}...`);
    
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
    
    let salaryCat = categories.find(c => c.name === 'เงินเดือน' && c.typeId === incomeType?.id);
    if (!salaryCat && incomeType) {
      salaryCat = await prisma.transactionCategory.create({
        data: { name: 'เงินเดือน', typeId: incomeType.id, organizationId: testOrg.id }
      });
    }

    let savingCat = categories.find(c => c.name === 'เงินออม' && c.typeId === savingType?.id);
    if (!savingCat && savingType) {
      savingCat = await prisma.transactionCategory.create({
        data: { name: 'เงินออม', typeId: savingType.id, organizationId: testOrg.id }
      });
    }

    let emergencyCat = categories.find(c => c.name === 'เงินฉุกเฉิน' && c.typeId === savingType?.id);
    if (!emergencyCat && savingType) {
      emergencyCat = await prisma.transactionCategory.create({
        data: { name: 'เงินฉุกเฉิน', typeId: savingType.id, organizationId: testOrg.id }
      });
    }

    // 2. Create Accounts
    const kbank = await prisma.bank.findFirst({ where: { organizationId: testOrg.id, code: 'KBANK' } });
    const scb = await prisma.bank.findFirst({ where: { organizationId: testOrg.id, code: 'SCB' } });

    // Main Bank Account
    const mainAccount = await prisma.account.upsert({
      where: { id: `main-acc-${currentUser.id}` },
      update: {},
      create: {
        id: `main-acc-${currentUser.id}`,
        name: 'Main KBANK',
        type: 'BANK',
        bankId: kbank?.id,
        userId: currentUser.id,
        organizationId: testOrg.id,
        actualDate: new Date()
      }
    });

    // Emergency Account
    const emergencyAccount = await prisma.account.upsert({
      where: { id: `emergency-acc-${currentUser.id}` },
      update: {},
      create: {
        id: `emergency-acc-${currentUser.id}`,
        name: 'Emergency SCB',
        type: 'EMERGENCY',
        bankId: scb?.id,
        userId: currentUser.id,
        organizationId: testOrg.id,
        actualDate: new Date()
      }
    });

    // Saving Account
    const savingAccount = await prisma.account.upsert({
      where: { id: `saving-acc-${currentUser.id}` },
      update: {},
      create: {
        id: `saving-acc-${currentUser.id}`,
        name: 'Saving Fund',
        type: 'SAVING',
        userId: currentUser.id,
        organizationId: testOrg.id,
        actualDate: new Date()
      }
    });

    // 3. Ensure Assets exist
    for (const acc of [mainAccount, emergencyAccount, savingAccount]) {
      await prisma.asset.upsert({
        where: { accountId: acc.id },
        update: {},
        create: {
          accountId: acc.id,
          userId: currentUser.id,
          organizationId: testOrg.id,
          amount: 0
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
        userId: currentUser.id,
        organizationId: testOrg.id,
        accountId: mainAccount.id,
        categoryId: salaryCat!.id,
        typeId: incomeType?.id || '',
        amount: 100000,
        description: 'Monthly Salary',
        date: new Date(currentYear, currentMonth, 1),
        assetId: (await prisma.asset.findUnique({ where: { accountId: mainAccount.id } }))?.id
      }
    });

    // EMERGENCY Income (45,000)
    await prisma.transaction.create({
      data: {
        userId: currentUser.id,
        organizationId: testOrg.id,
        accountId: emergencyAccount.id,
        categoryId: emergencyCat!.id,
        typeId: incomeType?.id || '',
        amount: 45000,
        description: 'Emergency Fund Top-up',
        date: new Date(currentYear, currentMonth, 5),
        assetId: (await prisma.asset.findUnique({ where: { accountId: emergencyAccount.id } }))?.id
      }
    });

    // INTERNAL TRANSFER -> From Main to Saving (5,000)
    await prisma.transaction.create({
      data: {
        userId: currentUser.id,
        organizationId: testOrg.id,
        accountId: mainAccount.id,
        categoryId: transferCat!.id,
        typeId: transferType?.id || '',
        amount: 5000,
        description: 'Transfer to Savings',
        date: new Date(currentYear, currentMonth, 10),
        assetId: (await prisma.asset.findUnique({ where: { accountId: mainAccount.id } }))?.id
      }
    });

    // Update Asset amounts
    await prisma.asset.update({ where: { accountId: mainAccount.id }, data: { amount: 95000 } });
    await prisma.asset.update({ where: { accountId: emergencyAccount.id }, data: { amount: 45000 } });
    await prisma.asset.update({ where: { accountId: savingAccount.id }, data: { amount: 5000 } });
  }

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
