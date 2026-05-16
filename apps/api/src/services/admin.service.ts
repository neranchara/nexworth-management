import { prisma } from '../lib/prisma';
import { notificationService } from './notification.service';

export class AdminService {
  /**
   * Reconciles an account's balance by comparing it with the sum of all transactions.
   * Uses the behavior multiplier logic to ensure accuracy.
   */
  async reconcileAccountBalance(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        asset: true,
        liability: true,
        transactions: {
          include: { type: true }
        }
      }
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // Calculate sum using behavior logic
    let calculatedBalance = 0;
    for (const tx of account.transactions) {
      const behavior = tx.type.behavior;
      let multiplier = 0;
      
      if (['INCOME', 'SAVING', 'INVESTMENT', 'GOAL_SAVING', 'INTERNAL_TRANSFER', 'LOAN_BORROW'].includes(behavior)) {
        multiplier = 1;
      } else if (['EXPENSE', 'DEBT', 'LOAN_REPAY'].includes(behavior)) {
        multiplier = -1;
      }
      
      calculatedBalance += (tx.amount * multiplier);
    }

    const currentBalance = account.asset?.amount ?? account.liability?.amount ?? 0;
    const diff = currentBalance - calculatedBalance;
    const isMatch = Math.abs(diff) < 0.01;

    return {
      accountId,
      accountName: account.name,
      type: account.asset ? 'ASSET' : 'LIABILITY',
      currentBalance: parseFloat(currentBalance.toFixed(2)),
      calculatedBalance: parseFloat(calculatedBalance.toFixed(2)),
      diff: parseFloat(diff.toFixed(2)),
      isMatch,
      transactionCount: account.transactions.length
    };
  }

  /**
   * Forces the account balance to match the calculated transaction sum.
   * Records an audit log for this administrative action.
   */
  async syncAccountBalance(accountId: string, performedBy: string) {
    const report = await this.reconcileAccountBalance(accountId);
    
    if (report.isMatch) {
      return { success: true, message: 'Account is already in sync.', report };
    }

    if (report.type === 'ASSET') {
      await prisma.asset.update({
        where: { accountId },
        data: { amount: report.calculatedBalance }
      });
    } else {
      await prisma.liability.update({
        where: { accountId },
        data: { amount: report.calculatedBalance }
      });
    }

    // Record special audit log for manual override
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_BALANCE_SYNC',
        entity: report.type === 'ASSET' ? 'Asset' : 'Liability',
        entityId: accountId,
        oldValue: { amount: report.currentBalance },
        newValue: { amount: report.calculatedBalance },
        performedBy,
        riskTag: 'DATA_INTEGRITY_FIX',
        reason: 'Admin forced balance synchronization due to mismatch with transaction history.'
      }
    });

    return { 
      success: true, 
      message: `Successfully synchronized ${report.accountName}. Balance set to ${report.calculatedBalance}.`,
      previousBalance: report.currentBalance,
      newBalance: report.calculatedBalance
    };
  }

  /**
   * Fixes data anomalies like the "Year 46143" issue mentioned by BA.
   * Scans for transactions with dates outside a reasonable range.
   */
  async sanitizeTransactionDates(organizationId: string) {
    const minReasonableDate = new Date('2000-01-01');
    const maxReasonableDate = new Date('2100-01-01');

    // Find anomalies
    const anomalies = await prisma.transaction.findMany({
      where: {
        organizationId,
        OR: [
          { createdAt: { lt: minReasonableDate } },
          { createdAt: { gt: maxReasonableDate } }
        ]
      }
    });

    if (anomalies.length === 0) {
      return { fixedCount: 0, message: "No date anomalies found." };
    }

    // Fix them by resetting to current date (as a fallback) or marking them
    // In a real scenario, we might want to flag them for manual review
    const fixed = await prisma.transaction.updateMany({
      where: {
        id: { in: anomalies.map(a => a.id) }
      },
      data: {
        createdAt: new Date()
      }
    });

    return {
      fixedCount: fixed.count,
      affectedIds: anomalies.map(a => a.id),
      message: `Successfully reset ${fixed.count} anomalies to current date.`
    };
  }

  /**
   * Performs reconciliation for all accounts belonging to a specific user.
   * Useful for bulk fixes from the Ops Center.
   */
  async reconcileUserAccounts(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true }
    });

    const results = [];
    for (const acc of accounts) {
      results.push(await this.reconcileAccountBalance(acc.id));
    }
    return results;
  }

  /**
   * Performs a bulk reconciliation for an entire organization.
   */
  async bulkReconcile(organizationId: string) {
    const accounts = await prisma.account.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const results = [];
    for (const acc of accounts) {
      const result = await this.reconcileAccountBalance(acc.id);
      if (!result.isMatch) {
        results.push(result);
      }
    }

    return {
      totalChecked: accounts.length,
      mismatchCount: results.length,
      mismatches: results
    };
  }

  /**
   * 3. Global Integrity Report
   * Summarizes the health of the entire database.
   */
  async getGlobalIntegrityReport() {
    const allAccounts = await prisma.account.findMany();
    let totalMatch = 0;
    let totalMismatch = 0;
    let totalDiffValue = 0;

    for (const account of allAccounts) {
      const res = await this.reconcileAccountBalance(account.id);
      if (res.isMatch) {
        totalMatch++;
      } else {
        totalMismatch++;
        totalDiffValue += Math.abs(res.diff);
      }
    }

    const integrityScore = allAccounts.length > 0 ? (totalMatch / allAccounts.length) * 100 : 100;

    // Trigger Integrity Alert if score is low
    if (integrityScore < 95) {
      notificationService.sendIntegrityAlert(integrityScore, totalMismatch);
    }

    return {
      integrityScore: parseFloat(integrityScore.toFixed(2)),
      totalAccounts: allAccounts.length,
      mismatchCount: totalMismatch,
      totalAnomalousValue: totalDiffValue,
      scannedAt: new Date()
    };
  }

  /**
   * Synchronizes LINE Bot status for a specific user.
   * Verifies if the user is paired and sends a heartbeat notification.
   */
  async syncLineUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, lineUserId: true, email: true }
    });

    if (!user) throw new Error('User not found');
    if (!user.lineUserId) {
      return { 
        status: 'unlinked', 
        message: 'User is not currently paired with LINE Bot.' 
      };
    }

    try {
      // Send a sync notification to the user's LINE
      await notificationService.sendDirectMessage(user.lineUserId, 
        `🔄 [SYSTEM SYNC]\n\nบัญชี Nexworth ของคุณ (${user.email}) ได้รับการตรวจสอบและซิงโครไนซ์สถานะเรียบร้อยแล้วครับ!`
      );

      return { 
        status: 'synced', 
        message: 'Successfully synchronized with LINE and sent heartbeat notification.',
        lineUserId: user.lineUserId 
      };
    } catch (error: any) {
      console.error('LINE sync failed:', error);
      return { 
        status: 'error', 
        message: `LINE sync failed: ${error.message}` 
      };
    }
  }

  /**
   * Retrieves all impersonation (support) logs for audit transparency.
   * Part of the Support Console (Ops Center) implementation.
   */
  async getImpersonationLogs() {
    return await prisma.impersonationLog.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        impersonator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }
}

export const adminService = new AdminService();
