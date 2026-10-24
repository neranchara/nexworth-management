// NEX-FEAT-11: finish the P6 migration — assetMultiplier/liabMultiplier were the only two
// BEHAVIOR_METADATA fields still not DB-driven per TransactionType. Backfill them from the
// same fallback constant so getAssetMultiplier() can start reading from the DB.
import { prisma } from '../lib/prisma';
import { BEHAVIOR_METADATA } from '../constants/transactionConfig.js';

async function main() {
  console.log('▶ NEX-FEAT-11 Backfill: TransactionType.assetMultiplier / liabMultiplier');

  const types = await prisma.transactionType.findMany({
    where: { OR: [{ assetMultiplier: null }, { liabMultiplier: null }] }
  });
  console.log(`  Found ${types.length} TransactionType records missing multiplier metadata`);

  for (const t of types) {
    const meta = BEHAVIOR_METADATA[t.behavior];
    if (!meta) {
      console.log(`  ⚠ Skipping ${t.id} (${t.name}) — no BEHAVIOR_METADATA for behavior "${t.behavior}"`);
      continue;
    }
    await prisma.transactionType.update({
      where: { id: t.id },
      data: {
        assetMultiplier: t.assetMultiplier ?? meta.assetMultiplier,
        liabMultiplier: t.liabMultiplier ?? meta.liabMultiplier,
      }
    });
  }
  console.log('✅ NEX-FEAT-11 backfill complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
