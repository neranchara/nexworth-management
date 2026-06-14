/**
 * Migration: "ปล่อยกู้" (INVESTMENT) → LEND_OUT Loan records
 *
 * สิ่งที่ script นี้ทำ:
 * 1. หา transactions ทั้งหมดที่ category name = "ปล่อยกู้"
 * 2. สร้าง Loan record (direction=LEND) สำหรับแต่ละ transaction
 * 3. Set loanId กลับไปที่ transaction
 * 4. เปลี่ยน category/type ของ transaction เป็น LEND_OUT (cashflowBucket: loan)
 *
 * ผลกระทบ:
 * - Cashflow bucket เปลี่ยนจาก 'invest' → 'loan' (ยืนยันกับผู้ใช้แล้ว)
 * - ยอด asset ไม่เปลี่ยน
 * - Repayments เดิม (ถ้ามี) ยังไม่ได้ link อัตโนมัติ — ต้องทำเพิ่มเติมด้วยมือ
 *
 * ทดสอบ (dry run): DRY_RUN=true npx ts-node src/scripts/migrate-ploy-ku-to-lend-loans.ts
 * รันจริง:         npx ts-node src/scripts/migrate-ploy-ku-to-lend-loans.ts
 */

import { prisma } from '../lib/prisma';
import { SYSTEM_CATEGORY_KEYS, BEHAVIOR_METADATA } from '../constants/transactionConfig.js';

const DRY_RUN = process.env.DRY_RUN === 'true';

async function getOrCreateCategory(
  behavior: 'LEND_OUT' | 'LEND_REPAY',
  organizationId: string
) {
  const systemKey = behavior === 'LEND_OUT'
    ? SYSTEM_CATEGORY_KEYS.LEND_OUT_SYS
    : SYSTEM_CATEGORY_KEYS.LEND_REPAY_SYS;
  const name = behavior === 'LEND_OUT' ? 'ให้ยืมเงิน' : 'รับเงินคืน';
  const meta = BEHAVIOR_METADATA[behavior];

  let cat = await prisma.transactionCategory.findFirst({
    where: { systemKey, organizationId },
    include: { type: true }
  });

  if (!cat) {
    let type = await prisma.transactionType.findFirst({
      where: { behavior, organizationId }
    });
    if (!type) {
      type = await prisma.transactionType.create({
        data: {
          name,
          behavior,
          organizationId,
          defaultDirection: meta.defaultDirection,
          isExpenseLike: meta.isExpenseLike,
          cashflowBucket: meta.cashflowBucket,
        }
      });
    }
    cat = await prisma.transactionCategory.create({
      data: { name, typeId: type.id, organizationId, systemKey },
      include: { type: true }
    });
  }

  return cat;
}

async function main() {
  console.log(`▶ Migration: ปล่อยกู้ → LEND_OUT Loans [${DRY_RUN ? 'DRY RUN' : 'LIVE'}]`);
  console.log('');

  // 1. หา transactions ทั้งหมดที่ category name = "ปล่อยกู้"
  const ployKuTransactions = await prisma.transaction.findMany({
    where: {
      loanId: null, // ยังไม่ได้ link กับ Loan record
      category: { name: 'ปล่อยกู้' }
    },
    include: {
      category: { include: { type: true } },
      account: true,
      asset: true,
    },
    orderBy: { date: 'asc' }
  });

  console.log(`📋 พบ ${ployKuTransactions.length} รายการ "ปล่อยกู้" ที่ยังไม่มี Loan record`);

  if (ployKuTransactions.length === 0) {
    console.log('✅ ไม่มีรายการที่ต้อง migrate');
    return;
  }

  // แสดง preview ทุก transaction ที่จะ migrate
  console.log('');
  console.log('รายการที่จะ migrate:');
  ployKuTransactions.forEach((tx, i) => {
    console.log(`  ${i + 1}. [${tx.organizationId}] ${tx.description || '-'} | ฿${tx.amount.toLocaleString()} | ${tx.account?.name || tx.accountId} | ${tx.date.toISOString().split('T')[0]}`);
  });
  console.log('');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN mode — ไม่มีการเปลี่ยนแปลงจริง');
    return;
  }

  // Group by organizationId เพื่อ create LEND_OUT + LEND_REPAY category per org
  const orgIds = [...new Set(ployKuTransactions.map(tx => tx.organizationId).filter(Boolean))] as string[];
  const lendOutCatByOrg: Record<string, any> = {};
  const lendRepayCatByOrg: Record<string, any> = {};

  for (const orgId of orgIds) {
    lendOutCatByOrg[orgId]   = await getOrCreateCategory('LEND_OUT',   orgId);
    lendRepayCatByOrg[orgId] = await getOrCreateCategory('LEND_REPAY', orgId);
    console.log(`✅ LEND_OUT + LEND_REPAY categories พร้อมสำหรับ org: ${orgId}`);
  }

  // 2. สร้าง Loan record + update transaction แต่ละรายการ
  let successCount = 0;
  let errorCount = 0;

  for (const tx of ployKuTransactions) {
    try {
      const orgId = tx.organizationId!;
      const lendOutCat = lendOutCatByOrg[orgId];

      // นับ Loan records ที่มีอยู่แล้ว (direction=LEND) เพื่อสร้าง code
      const lendCount = await prisma.loan.count({
        where: { organizationId: orgId, direction: 'LEND' }
      });
      const code = `D${String(lendCount + 1).padStart(3, '0')}`;

      // หา assetId จาก account
      const assetId = tx.assetId || null;
      const liabilityId = tx.liabilityId || null;

      // สร้าง Loan record
      const loan = await prisma.loan.create({
        data: {
          code,
          userId: tx.userId,
          organizationId: orgId,
          accountId: tx.accountId,
          assetId,
          liabilityId,
          name: tx.description || 'ปล่อยกู้ (migrated)',
          direction: 'LEND',
          totalAmount: tx.amount,
          date: tx.date,
          actualDate: tx.actualDate || tx.date,
        }
      });

      // Update transaction: set loanId + เปลี่ยน category เป็น LEND_OUT
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          loanId: loan.id,
          categoryId: lendOutCat.id,
          typeId: lendOutCat.type.id,
        }
      });

      console.log(`  ✅ [${code}] ${loan.name} | ฿${loan.totalAmount.toLocaleString()} → Loan ${loan.id}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Transaction ${tx.id} failed:`, err);
      errorCount++;
    }
  }

  console.log('');
  console.log(`📊 ผลลัพธ์: สำเร็จ ${successCount} รายการ | ผิดพลาด ${errorCount} รายการ`);
  console.log('');

  // 3. สรุปสถานะหลัง migrate
  if (successCount > 0) {
    const lendLoans = await prisma.loan.findMany({
      where: { direction: 'LEND' },
      select: { code: true, name: true, totalAmount: true, organizationId: true }
    });
    console.log(`📋 Loan records ทั้งหมดหลัง migrate (direction=LEND): ${lendLoans.length} รายการ`);
    lendLoans.forEach(l => {
      console.log(`  ${l.code} | ${l.name} | ฿${l.totalAmount.toLocaleString()}`);
    });
  }

  console.log('');
  console.log('⚠️  หมายเหตุ: Repayment transactions เดิม (ถ้ามี) ยังไม่ได้ link อัตโนมัติ');
  console.log('   ต้องบันทึก "รับคืน" ผ่าน Loan Tracker ใหม่ หรือ run script แยกสำหรับ repayments');
  console.log('');
  console.log('✅ Migration complete');
}

main()
  .catch(e => { console.error('❌ Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
