// NEX-BUG-15: 'goals' was never added to the RBAC resource list, so no Role in any
// org has a Permission row for it — hasPermission('goals') falls through to false for
// everyone except system admins, which is why the desktop sidebar (permission-gated)
// hides "เป้าหมาย" while the mobile bottom nav (hardcoded, no permission check) shows it.
// Backfill a 'goals' Permission row for every existing Role, matching the same
// full-CRUD-for-Admin / view-only-for-everyone-else pattern used when seeding new orgs.
import { prisma, logConnectedDatabase } from '../lib/prisma-script.js';

async function main() {
  await logConnectedDatabase();
  console.log('▶ NEX-BUG-15 Backfill: Role → goals Permission');

  const roles = await prisma.role.findMany({ select: { id: true, name: true, organizationId: true } });
  console.log(`  Found ${roles.length} roles across all orgs`);

  let created = 0;
  for (const role of roles) {
    const isAdmin = role.name === 'Admin';
    const data = isAdmin
      ? { canView: true, canCreate: true, canUpdate: true, canDelete: true }
      : { canView: true, canCreate: false, canUpdate: false, canDelete: false };

    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: role.id, resource: 'goals' } },
      update: data,
      create: { roleId: role.id, resource: 'goals', ...data },
    });
    created += 1;
  }

  console.log(`✅ NEX-BUG-15 backfill complete — ${created} Permission rows upserted`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
