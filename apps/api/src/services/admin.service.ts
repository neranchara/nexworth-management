import { prisma } from '../lib/prisma';
import { notificationService } from './notification.service';

export class AdminService {
  /**
   * Reconciles an account's balance by comparing it with the sum of all transactions.
   * Based on SA's recommendation for institutional-grade data integrity.
   */
  async reconcileAccountBalance(accountId: string) {
    // 1. Fetch current cached balance
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        asset: true,
        liability: true
      }
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // 2. Aggregate sum from all transactions
    const aggregations = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { accountId: accountId }
    });

    const calculatedBalance = aggregations._sum.amount || 0;

    // 3. Verify integrity
    // Note: In Nexworth, Account balance might be stored in the Account model or linked Asset/Liability
    // Current As-Is logic stores balances in multiple places.
    const currentBalance = account.asset?.amount ?? account.liability?.amount ?? 0;
    const diff = currentBalance - calculatedBalance;
    const isMatch = Math.abs(diff) < 0.01; // Using epsilon for float comparison

    // Trigger High Value Alert (ISP Recommendation)
    if (!isMatch && Math.abs(diff) >= 1000000) {
      notificationService.sendHighValueAlert(accountId, diff);
    }
    
    return {
      accountId,
      accountName: account.name,
      currentBalance,
      calculatedBalance,
      diff: currentBalance - calculatedBalance,
      isMatch
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
}

export const adminService = new AdminService();
