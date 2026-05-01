import { prisma } from '@nexworth/database';

export const setupOrganizationDefaults = async (orgId: string, adminUserId: string) => {
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
    // Admin gets all permissions
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

    // Other roles get view-only for basic features, but NOT setup or management
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
};
