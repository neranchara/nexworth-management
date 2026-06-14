import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

describe('Audit Log System', () => {
  let testOrgId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test data
    const org = await prisma.organization.create({
      data: {
        name: 'Test Audit Org',
      },
    });
    testOrgId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `test_audit_${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        organizationId: testOrgId,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.auditLog.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.organization.delete({ where: { id: testOrgId } });
  });

  it('should record an audit log when an account is created', async () => {
    // Create an account
    const account = await prisma.account.create({
      data: {
        name: 'Test Audit Account',
        type: 'BANK',
        organizationId: testOrgId,
        userId: testUserId,
      },
    });

    // Wait a bit for async log recording
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if AuditLog exists
    const logs = await prisma.auditLog.findMany({
      where: {
        entityId: account.id,
        action: 'CREATE',
      },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].entity).toBe('Account');
    expect(logs[0].newValue).toBeDefined();
    expect((logs[0].newValue as any).name).toBe('Test Audit Account');
  });

  it('should record an audit log with oldValue when an account is updated', async () => {
    const account = await prisma.account.create({
      data: {
        name: 'Update Test Account',
        type: 'BANK',
        organizationId: testOrgId,
        userId: testUserId,
      },
    });

    // Update the account
    await prisma.account.update({
      where: { id: account.id },
      data: { name: 'Updated Name' },
    });

    // Wait a bit for async log recording
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if AuditLog exists with old and new values
    const logs = await prisma.auditLog.findMany({
      where: {
        entityId: account.id,
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].oldValue).toBeDefined();
    expect((logs[0].oldValue as any).name).toBe('Update Test Account');
    expect((logs[0].newValue as any).name).toBe('Updated Name');
  });

  it('should record an audit log when a record is deleted', async () => {
    const account = await prisma.account.create({
      data: {
        name: 'Delete Test Account',
        type: 'BANK',
        organizationId: testOrgId,
        userId: testUserId,
      },
    });

    // Delete the account
    await prisma.account.delete({
      where: { id: account.id },
    });

    // Wait a bit for async log recording
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if AuditLog exists for DELETE
    const logs = await prisma.auditLog.findMany({
      where: {
        entityId: account.id,
        action: 'DELETE',
      },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].oldValue).toBeDefined();
    expect((logs[0].oldValue as any).name).toBe('Delete Test Account');
  });
});
