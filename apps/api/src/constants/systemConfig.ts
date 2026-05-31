export const SYSTEM_ADMIN_EMAIL = 'superadmin@nexworth.cc';
export const SUPER_ADMIN_ROLE = 'Super Admin';
export const ADMIN_ROLES = ['Admin', 'Super Admin', 'Operation'] as const;
export const SYSTEM_ORG_NAME = 'System Management';
export const SYSTEM_ORG_ID = '7f4b8f80-dfb7-4492-9a06-28dad5691dd7';

export function checkIsSystemAdmin(opts: { email: string; orgName?: string | null; flag?: boolean }): boolean {
  return opts.flag === true || opts.email === SYSTEM_ADMIN_EMAIL || opts.orgName === SYSTEM_ORG_NAME;
}

export function checkIsSuperAdmin(opts: { email: string; role: string }): boolean {
  return opts.email === SYSTEM_ADMIN_EMAIL || opts.role === SUPER_ADMIN_ROLE;
}

export function checkHasAdminAccess(opts: { role: string; flag?: boolean }): boolean {
  return opts.flag === true || (ADMIN_ROLES as readonly string[]).includes(opts.role);
}
