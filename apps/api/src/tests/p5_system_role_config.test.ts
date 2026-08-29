import { describe, it, expect } from 'vitest';
import {
  SYSTEM_ADMIN_EMAIL,
  SUPER_ADMIN_ROLE,
  ADMIN_ROLES,
  SYSTEM_ORG_NAME,
  SYSTEM_ORG_ID,
  checkIsSystemAdmin,
  checkIsSuperAdmin,
  checkHasAdminAccess,
} from '../constants/systemConfig.js';

// ─────────────────────────────────────────────
// P5: SystemRoleConfig — unit tests
// ─────────────────────────────────────────────

describe('P5 — SystemRoleConfig constants', () => {
  it('exports correct constant values', () => {
    expect(SYSTEM_ADMIN_EMAIL).toBe('superadmin@nexworth.cc');
    expect(SUPER_ADMIN_ROLE).toBe('Super Admin');
    expect(SYSTEM_ORG_NAME).toBe('System Management');
    expect(SYSTEM_ORG_ID).toBe('7f4b8f80-dfb7-4492-9a06-28dad5691dd7');
    expect(ADMIN_ROLES).toContain('Admin');
    expect(ADMIN_ROLES).toContain('Super Admin');
    expect(ADMIN_ROLES).toContain('Operation');
  });
});

describe('P5 — checkIsSystemAdmin()', () => {
  it('returns true when isSystemAdmin flag is true', () => {
    expect(checkIsSystemAdmin({ email: 'anyone@test.com', flag: true })).toBe(true);
  });

  it('returns true when email matches SYSTEM_ADMIN_EMAIL', () => {
    expect(checkIsSystemAdmin({ email: SYSTEM_ADMIN_EMAIL })).toBe(true);
  });

  it('returns true when orgName matches SYSTEM_ORG_NAME', () => {
    expect(checkIsSystemAdmin({ email: 'other@test.com', orgName: SYSTEM_ORG_NAME })).toBe(true);
  });

  it('returns false for regular user', () => {
    expect(checkIsSystemAdmin({ email: 'user@company.com', orgName: 'Company A', flag: false })).toBe(false);
  });

  it('returns false when flag is explicitly false even with system email', () => {
    expect(checkIsSystemAdmin({ email: 'user@company.com', flag: false })).toBe(false);
  });
});

describe('P5 — checkIsSuperAdmin()', () => {
  it('returns true when email matches SYSTEM_ADMIN_EMAIL', () => {
    expect(checkIsSuperAdmin({ email: SYSTEM_ADMIN_EMAIL, role: 'Admin' })).toBe(true);
  });

  it('returns true when role matches SUPER_ADMIN_ROLE', () => {
    expect(checkIsSuperAdmin({ email: 'other@test.com', role: SUPER_ADMIN_ROLE })).toBe(true);
  });

  it('returns false for regular admin', () => {
    expect(checkIsSuperAdmin({ email: 'admin@company.com', role: 'Admin' })).toBe(false);
  });

  it('returns false for operation role', () => {
    expect(checkIsSuperAdmin({ email: 'ops@company.com', role: 'Operation' })).toBe(false);
  });
});

describe('P5 — checkHasAdminAccess()', () => {
  it('returns true when isSystemAdmin flag is true', () => {
    expect(checkHasAdminAccess({ role: 'Guest', flag: true })).toBe(true);
  });

  it('returns true for Admin role', () => {
    expect(checkHasAdminAccess({ role: 'Admin' })).toBe(true);
  });

  it('returns true for Super Admin role', () => {
    expect(checkHasAdminAccess({ role: 'Super Admin' })).toBe(true);
  });

  it('returns true for Operation role', () => {
    expect(checkHasAdminAccess({ role: 'Operation' })).toBe(true);
  });

  it('returns false for regular user role', () => {
    expect(checkHasAdminAccess({ role: 'Production User' })).toBe(false);
  });

  it('returns false for Guest role', () => {
    expect(checkHasAdminAccess({ role: 'Guest', flag: false })).toBe(false);
  });
});
