/**
 * seed-master-db.ts
 *
 * Initializes a fresh DB with all required base data:
 *   1. Global TransactionBehavior metadata (organizationId = null) — source of truth
 *   2. System Management organization (fixed UUID)
 *   3. Super Admin role + all system roles
 *   4. superadmin user
 *   5. Standard system categories with systemKey
 *
 * Safe to re-run: all operations use upsert.
 *
 * Usage:
 *   npx tsx apps/api/src/scripts/seed-master-db.ts
 */

import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import {
  SYSTEM_ADMIN_EMAIL,
  SUPER_ADMIN_ROLE,
  ADMIN_ROLES,
  SYSTEM_ORG_NAME,
  SYSTEM_ORG_ID,
} from '../constants/systemConfig.js';
import { BEHAVIOR_METADATA, SYSTEM_CATEGORY_KEYS } from '../constants/transactionConfig.js';

const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || 'Nexworth@SuperAdmin2025!';

// ─────────────────────────────────────────────
// 1. Global Behavior Types (organizationId = null)
//    These are the canonical definitions shared across all orgs.
// ─────────────────────────────────────────────
const GLOBAL_BEHAVIOR_TYPES = [
  { name: 'รายรับ',         behavior: 'INCOME' },
  { name: 'รายจ่าย',        behavior: 'EXPENSE' },
  { name: 'ออม',            behavior: 'SAVING' },
  { name: 'ลงทุน',          behavior: 'INVESTMENT' },
  { name: 'โอนภายใน',       behavior: 'INTERNAL_TRANSFER' },
  { name: 'หนี้',           behavior: 'DEBT' },
  { name: 'ยืมเงินภายใน',   behavior: 'LOAN_BORROW' },
  { name: 'คืนเงินภายใน',   behavior: 'LOAN_REPAY' },
  { name: 'เงินมีเป้าหมาย', behavior: 'GOAL_SAVING' },
  { name: 'เงินฉุกเฉิน',    behavior: 'EMERGENCY' },
  { name: 'เป้าหมาย',       behavior: 'GOAL' },
];

// ─────────────────────────────────────────────
// 2. System roles for the master org
// ─────────────────────────────────────────────
const SYSTEM_ROLES = [
  { name: SUPER_ADMIN_ROLE,    description: 'Full access to all organizations and system settings', isSystemRole: true },
  { name: 'Admin',             description: 'Organization-level admin',                            isSystemRole: true },
  { name: 'Operation',         description: 'Operations access — read/write, no user management',  isSystemRole: true },
  { name: 'App Support',       description: 'Support access — read-only across orgs',              isSystemRole: true },
];

// ─────────────────────────────────────────────
// Resources that system roles have access to
// ─────────────────────────────────────────────
const ALL_RESOURCES = [
  'dashboard', 'users', 'transactions', 'permissions', 'monthly',
  'loan-tracker', 'liabilities', 'assets', 'accounts', 'banks',
  'types', 'categories', 'organizations',
];

async function seedGlobalBehaviorTypes() {
  console.log('▶ Seeding global behavior types (organizationId = null)...');
  const globalTypes: Record<string, any> = {};

  for (const t of GLOBAL_BEHAVIOR_TYPES) {
    const meta = BEHAVIOR_METADATA[t.behavior];
    const data = {
      behavior:         t.behavior as any,
      defaultDirection: meta.defaultDirection,
      isExpenseLike:    meta.isExpenseLike,
      cashflowBucket:   meta.cashflowBucket,
    };
    // Prisma upsert doesn't support null in composite unique — use find+create/update
    let record = await prisma.transactionType.findFirst({
      where: { organizationId: null, behavior: t.behavior as any }
    });
    if (record) {
      record = await prisma.transactionType.update({ where: { id: record.id }, data });
    } else {
      record = await prisma.transactionType.create({
        data: { name: t.name, organizationId: null, ...data }
      });
    }
    globalTypes[t.behavior] = record;
    console.log(`  ✓ ${t.behavior} → "${t.name}" (dir=${meta.defaultDirection}, bucket=${meta.cashflowBucket ?? '-'})`);
  }

  // Seed global system categories
  const systemCategories = [
    { name: 'โอนเข้าภายใน', behavior: 'INCOME',      systemKey: SYSTEM_CATEGORY_KEYS.TRANSFER_IN },
    { name: 'โอนออกภายใน',  behavior: 'EXPENSE',     systemKey: SYSTEM_CATEGORY_KEYS.TRANSFER_OUT },
    { name: 'ยืมเงินภายใน', behavior: 'LOAN_BORROW', systemKey: SYSTEM_CATEGORY_KEYS.LOAN_BORROW_SYS },
    { name: 'คืนเงินภายใน', behavior: 'LOAN_REPAY',  systemKey: SYSTEM_CATEGORY_KEYS.LOAN_REPAY_SYS },
  ];

  for (const cat of systemCategories) {
    const type = globalTypes[cat.behavior];
    if (!type) continue;
    let existing = await prisma.transactionCategory.findFirst({
      where: { organizationId: null, systemKey: cat.systemKey }
    });
    if (existing) {
      await prisma.transactionCategory.update({ where: { id: existing.id }, data: { name: cat.name } });
    } else {
      await prisma.transactionCategory.create({
        data: { name: cat.name, typeId: type.id, organizationId: null, systemKey: cat.systemKey }
      });
    }
    console.log(`  ✓ category "${cat.name}" → systemKey=${cat.systemKey}`);
  }

  console.log('  ✅ Global behavior types seeded\n');
  return globalTypes;
}

async function seedSystemManagementOrg() {
  console.log(`▶ Seeding System Management org (id=${SYSTEM_ORG_ID})...`);

  const org = await prisma.organization.upsert({
    where: { id: SYSTEM_ORG_ID },
    update: { name: SYSTEM_ORG_NAME, isActive: true },
    create: { id: SYSTEM_ORG_ID, name: SYSTEM_ORG_NAME, isActive: true },
  });
  console.log(`  ✓ Org: "${org.name}" (${org.id})\n`);
  return org;
}

async function seedSystemRoles(orgId: string) {
  console.log('▶ Seeding system roles...');
  const roles: Record<string, any> = {};

  for (const r of SYSTEM_ROLES) {
    roles[r.name] = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: orgId, name: r.name } },
      update: { description: r.description, isSystemRole: r.isSystemRole, isActive: true },
      create: { name: r.name, description: r.description, organizationId: orgId, isSystemRole: r.isSystemRole },
    });
    console.log(`  ✓ Role: "${r.name}"`);
  }

  // Super Admin → all permissions on all resources
  for (const resource of ALL_RESOURCES) {
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles[SUPER_ADMIN_ROLE].id, resource } },
      update: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
      create: { roleId: roles[SUPER_ADMIN_ROLE].id, resource, canView: true, canCreate: true, canUpdate: true, canDelete: true },
    });
  }
  console.log(`  ✓ Permissions: ${SUPER_ADMIN_ROLE} → all ${ALL_RESOURCES.length} resources`);

  // Admin → all permissions
  for (const resource of ALL_RESOURCES) {
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles['Admin'].id, resource } },
      update: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
      create: { roleId: roles['Admin'].id, resource, canView: true, canCreate: true, canUpdate: true, canDelete: true },
    });
  }
  console.log(`  ✓ Permissions: Admin → all resources`);

  // Operation → no users/permissions management
  const opExclude = ['users', 'permissions', 'organizations'];
  for (const resource of ALL_RESOURCES) {
    const canWrite = !opExclude.includes(resource);
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles['Operation'].id, resource } },
      update: { canView: true, canCreate: canWrite, canUpdate: canWrite, canDelete: false },
      create: { roleId: roles['Operation'].id, resource, canView: true, canCreate: canWrite, canUpdate: canWrite, canDelete: false },
    });
  }
  console.log(`  ✓ Permissions: Operation → read/write (no user mgmt)`);

  // App Support → read-only everywhere
  for (const resource of ALL_RESOURCES) {
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles['App Support'].id, resource } },
      update: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      create: { roleId: roles['App Support'].id, resource, canView: true, canCreate: false, canUpdate: false, canDelete: false },
    });
  }
  console.log(`  ✓ Permissions: App Support → read-only`);

  console.log();
  return roles;
}

async function seedSuperAdminUser(orgId: string, superAdminRoleId: string) {
  console.log(`▶ Seeding superadmin user (${SYSTEM_ADMIN_EMAIL})...`);

  const existing = await prisma.user.findUnique({ where: { email: SYSTEM_ADMIN_EMAIL } });

  if (existing) {
    await prisma.user.update({
      where: { email: SYSTEM_ADMIN_EMAIL },
      data: {
        organizationId: orgId,
        roleId:         superAdminRoleId,
        isSystemAdmin:  true,
        isActive:       true,
      },
    });
    console.log(`  ✓ Updated existing superadmin user`);
  } else {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email:          SYSTEM_ADMIN_EMAIL,
        passwordHash,
        firstName:      'System',
        lastName:       'Admin',
        organizationId: orgId,
        roleId:         superAdminRoleId,
        isSystemAdmin:  true,
        isActive:       true,
      },
    });
    console.log(`  ✓ Created superadmin user`);
    console.log(`  ⚠️  Default password set — change immediately after first login`);
  }
  console.log();
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Nexworth Master DB Seed');
  console.log('════════════════════════════════════════\n');

  await seedGlobalBehaviorTypes();
  const org = await seedSystemManagementOrg();
  const roles = await seedSystemRoles(org.id);
  await seedSuperAdminUser(org.id, roles[SUPER_ADMIN_ROLE].id);

  // Summary
  const typesCount = await prisma.transactionType.count({ where: { organizationId: null } });
  const catsCount  = await prisma.transactionCategory.count({ where: { organizationId: null } });

  console.log('════════════════════════════════════════');
  console.log('  ✅ Master DB seed complete');
  console.log(`  Global types:      ${typesCount}`);
  console.log(`  System categories: ${catsCount}`);
  console.log(`  Org:               ${SYSTEM_ORG_NAME} (${SYSTEM_ORG_ID})`);
  console.log(`  Superadmin:        ${SYSTEM_ADMIN_EMAIL}`);
  console.log('════════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
