import { prisma } from '../lib/prisma';
import { BEHAVIOR_METADATA, SYSTEM_CATEGORY_KEYS } from '../constants/transactionConfig.js';

export const setupOrganizationDefaults = async (orgId: string, adminUserId: string, db: any = prisma) => {
  // 1. Roles
  const roleNames = ['Admin', 'Production User', 'Officer', 'Guest'];
  const roles: any = {};
  
  for (const roleName of roleNames) {
    roles[roleName] = await db.role.upsert({
      where: { organizationId_name: { organizationId: orgId, name: roleName } },
      update: {},
      create: { name: roleName, organizationId: orgId },
    });
  }

  // 2. Assign Admin User to Admin Role
  await db.user.update({
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
    // Admin gets all permissions
    await db.permission.upsert({
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

    // Other roles get view-only for basic features, but NOT setup or management
    const managementResources = ['users', 'permissions', 'accounts', 'banks', 'types', 'categories'];
    for (const roleName of ['Production User', 'Officer', 'Guest']) {
       const canView = !managementResources.includes(resource);
       await db.permission.upsert({
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
    await db.bank.upsert({
      where: { organizationId_code: { organizationId: orgId, code: bank.code } },
      update: { name: bank.name },
      create: { name: bank.name, code: bank.code, organizationId: orgId }
    });
  }

  // 5. Seed Transaction Types for the Organization
  const typeData = [
    { name: 'รายรับ',         behavior: 'INCOME' },
    { name: 'รายจ่าย',        behavior: 'EXPENSE' },
    { name: 'ออม/ลงทุน',      behavior: 'SAVING' },
    { name: 'โอนภายใน',       behavior: 'INTERNAL_TRANSFER' },
    { name: 'หนี้',           behavior: 'DEBT' },
    { name: 'ยืมเงินภายใน',   behavior: 'LOAN_BORROW' },
    { name: 'คืนเงินภายใน',   behavior: 'LOAN_REPAY' },
    { name: 'เงินมีเป้าหมาย', behavior: 'GOAL_SAVING' },
    { name: 'ชำระหนี้บัตรเครดิต', behavior: 'LIABILITY_PAYMENT' },
  ];
  for (const t of typeData) {
    const meta = BEHAVIOR_METADATA[t.behavior];
    await db.transactionType.upsert({
      where: { organizationId_name: { organizationId: orgId, name: t.name } },
      update: {
        behavior:         t.behavior as any,
        defaultDirection: meta.defaultDirection,
        isExpenseLike:    meta.isExpenseLike,
        cashflowBucket:   meta.cashflowBucket,
      },
      create: {
        name:             t.name,
        behavior:         t.behavior as any,
        organizationId:   orgId,
        defaultDirection: meta.defaultDirection,
        isExpenseLike:    meta.isExpenseLike,
        cashflowBucket:   meta.cashflowBucket,
      }
    });
  }

  // 6. Seed Categories for the Organization
  const seededTypes = await db.transactionType.findMany({ where: { organizationId: orgId } });
  const getTypeId = (name: string) => seededTypes.find((t: any) => t.name === name)?.id;
  const getTypeByBehavior = (behavior: string) => seededTypes.find((t: any) => t.behavior === behavior)?.id;


  const categoryData: { name: string; typeName?: string; typeBehavior?: string; systemKey?: string }[] = [
    { name: 'เงินเดือน',        typeName: 'รายรับ' },
    { name: 'รายได้อื่น',       typeName: 'รายรับ' },
    { name: 'ค่าใช้จ่ายประจำ',  typeName: 'รายจ่าย' },
    { name: 'ค่าใช้จ่ายส่วนตัว', typeName: 'รายจ่าย' },
    { name: 'ครอบครัว',         typeName: 'รายจ่าย' },
    { name: 'ท่องเที่ยว',        typeName: 'ออม/ลงทุน' },
    { name: 'ค่าใช้จ่ายรถ',     typeName: 'ออม/ลงทุน' },
    { name: 'บริจาค',           typeName: 'ออม/ลงทุน' },
    { name: 'เงินออม',          typeName: 'ออม/ลงทุน' },
    { name: 'เงินฉุกเฉิน',      typeName: 'ออม/ลงทุน' },
    { name: 'เงินซื้อรถ',       typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนหุ้น',        typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนทอง',         typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนธุรกิจ',      typeName: 'ออม/ลงทุน' },
    { name: 'ชำระหนี้',         typeName: 'หนี้' },
    { name: 'ยืมเงิน',          typeBehavior: 'LOAN_BORROW' },
    { name: 'คืนเงิน',          typeBehavior: 'LOAN_REPAY' },
    // System-managed categories for internal transfers (auto-created on transfer)
    { name: 'โอนเข้าภายใน', typeBehavior: 'INCOME',            systemKey: SYSTEM_CATEGORY_KEYS.TRANSFER_IN },
    { name: 'โอนออกภายใน',  typeBehavior: 'EXPENSE',           systemKey: SYSTEM_CATEGORY_KEYS.TRANSFER_OUT },
    { name: 'ยืมเงินภายใน', typeBehavior: 'LOAN_BORROW',       systemKey: SYSTEM_CATEGORY_KEYS.LOAN_BORROW_SYS },
    { name: 'คืนเงินภายใน', typeBehavior: 'LOAN_REPAY',        systemKey: SYSTEM_CATEGORY_KEYS.LOAN_REPAY_SYS },
    { name: 'ชำระบัตรเครดิต', typeBehavior: 'LIABILITY_PAYMENT', systemKey: SYSTEM_CATEGORY_KEYS.LIABILITY_PAYMENT_SYS },
  ];

  for (const cat of categoryData) {
    const typeId = cat.typeName ? getTypeId(cat.typeName) : getTypeByBehavior(cat.typeBehavior!);
    if (typeId) {
      await db.transactionCategory.upsert({
        where: { organizationId_name_typeId: { organizationId: orgId, name: cat.name, typeId } },
        update: { systemKey: cat.systemKey ?? null },
        create: { name: cat.name, typeId, organizationId: orgId, systemKey: cat.systemKey ?? null }
      });
    }
  }
};

