import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { adminService } from '../services/admin.service';

describe('Reconciliation System', () => {
  let testOrgId: string;
  let testUserId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: 'Test Recon Org' },
    });
    testOrgId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `test_recon_${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        organizationId: testOrgId,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.asset.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.account.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.organization.delete({ where: { id: testOrgId } });
  });

  it('should detect a match when transactions sum matches account balance', async () => {
    const account = await prisma.account.create({
      data: {
        name: 'Recon Match Account',
        type: 'BANK',
        organizationId: testOrgId,
        userId: testUserId,
      },
    });

    // Create Asset with initial balance
    await prisma.asset.create({
      data: {
        amount: 1500,
        accountId: account.id,
        organizationId: testOrgId,
        userId: testUserId,
      }
    });

    const transType = await prisma.transactionType.create({
      data: { name: 'ReconType', behavior: 'INCOME', organizationId: testOrgId }
    });
    const category = await prisma.transactionCategory.create({
      data: { name: 'ReconCat', typeId: transType.id, organizationId: testOrgId }
    });

    // Create transaction that matches the asset balance
    await prisma.transaction.create({
      data: {
        amount: 1500,
        userId: testUserId,
        accountId: account.id,
        organizationId: testOrgId,
        categoryId: category.id,
        typeId: transType.id, // Missing this before
        description: 'Initial Deposit',
      }
    });

    const result = await adminService.reconcileAccountBalance(account.id);
    expect(result.isMatch).toBe(true);
    expect(result.currentBalance).toBe(1500);
    expect(result.calculatedBalance).toBe(1500);
  });

  it('should detect a mismatch when transactions sum does not match account balance', async () => {
    const account = await prisma.account.create({
      data: {
        name: 'Recon Mismatch Account',
        type: 'BANK',
        organizationId: testOrgId,
        userId: testUserId,
      },
    });

    await prisma.asset.create({
      data: {
        amount: 5000,
        accountId: account.id,
        organizationId: testOrgId,
        userId: testUserId,
      }
    });

    const transType = await prisma.transactionType.create({
      data: { name: 'ReconType2', behavior: 'INCOME', organizationId: testOrgId }
    });
    const category = await prisma.transactionCategory.create({
      data: { name: 'ReconCat2', typeId: transType.id, organizationId: testOrgId }
    });

    await prisma.transaction.create({
      data: {
        amount: 1000,
        userId: testUserId,
        accountId: account.id,
        organizationId: testOrgId,
        categoryId: category.id,
        typeId: transType.id,
        description: 'Deposit',
      }
    });

    const result = await adminService.reconcileAccountBalance(account.id);
    expect(result.isMatch).toBe(false);
    expect(result.diff).toBe(4000);
  });
});
