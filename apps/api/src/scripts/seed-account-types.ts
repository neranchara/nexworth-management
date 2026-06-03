/**
 * seed-account-types.ts
 *
 * Upserts the ACCOUNT_TYPES SystemConfig with the correct object format
 * required by dynamic classification (v7c6ba5c+).
 *
 * Usage (Render shell or local):
 *   npx tsx apps/api/src/scripts/seed-account-types.ts
 *
 * Safe to re-run (uses upsert).
 */

import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

const ACCOUNT_TYPES_VALUE = [
  // ─── ASSET / Non-counted (shows in บัญชีที่ไม่นับรวม tab) ───
  { value: 'BANK',        label: 'ธนาคาร',         category: 'ASSET',     subCategory: 'NONE' },
  { value: 'CASHFLOW',    label: 'กระแสเงินสด',    category: 'ASSET',     subCategory: 'NONE' },
  { value: 'INTERNAL',    label: 'ภายใน',           category: 'ASSET',     subCategory: 'NONE' },

  // ─── ASSET / Liquid (shows in All Accounts → CASH & BANKS) ───
  { value: 'SAVING',      label: 'เงินออม',         category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'EMERGENCY',   label: 'เงินฉุกเฉิน',     category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'GOAL',        label: 'เป้าหมาย',        category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'GOAL_SAVING', label: 'เงินมีเป้าหมาย', category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'FAMILY',      label: 'ครอบครัว',        category: 'ASSET',     subCategory: 'LIQUID' },

  // ─── ASSET / Investment (shows in All Accounts → INVESTMENTS) ───
  { value: 'STOCK',       label: 'หุ้น',             category: 'ASSET',     subCategory: 'INVESTMENT' },
  { value: 'GOLD',        label: 'ทอง',             category: 'ASSET',     subCategory: 'INVESTMENT' },
  { value: 'INVESTMENT',  label: 'การลงทุน',        category: 'ASSET',     subCategory: 'INVESTMENT' },

  // ─── LIABILITY ───
  { value: 'LIABILITY',   label: 'หนี้สิน',         category: 'LIABILITY', subCategory: 'NONE' },
];

async function main() {
  console.log('[seed-account-types] Upserting ACCOUNT_TYPES SystemConfig...');

  const result = await prisma.systemConfig.upsert({
    where: { key: 'ACCOUNT_TYPES' },
    update: {
      value: ACCOUNT_TYPES_VALUE as any,
      category: 'DROPDOWNS',
      updatedBy: 'SEED_SCRIPT',
    },
    create: {
      key: 'ACCOUNT_TYPES',
      value: ACCOUNT_TYPES_VALUE as any,
      category: 'DROPDOWNS',
      updatedBy: 'SEED_SCRIPT',
    },
  });

  console.log(`[seed-account-types] Done — ${ACCOUNT_TYPES_VALUE.length} types seeded (id: ${result.id})`);

  const assetTypes    = ACCOUNT_TYPES_VALUE.filter(t => t.category === 'ASSET' && t.subCategory !== 'NONE');
  const nonCounted    = ACCOUNT_TYPES_VALUE.filter(t => t.category === 'ASSET' && t.subCategory === 'NONE');
  const liabilityTypes = ACCOUNT_TYPES_VALUE.filter(t => t.category === 'LIABILITY');

  console.log(`  Assets (shown):      ${assetTypes.map(t => t.value).join(', ')}`);
  console.log(`  Assets (non-counted): ${nonCounted.map(t => t.value).join(', ')}`);
  console.log(`  Liabilities:         ${liabilityTypes.map(t => t.value).join(', ')}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
