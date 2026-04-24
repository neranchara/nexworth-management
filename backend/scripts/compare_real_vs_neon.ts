import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();

  // Real balances from bank statements
  const realBalances: Record<string, number> = {
    'กสิกร โอนภายใน':           34876.00,
    'ออมสิน สำรองครอบครัว':     69287.38,
    'ออมสิน เงินออมแม่':        12000.00,
    'ธนาคารอาคารสงเคราะห์':     178000.00,
    'ออมสิน บัญชีเงินซื้อรถ':   346032.08,
    'กรุงเทพ':                   8368.97,
    'ไทยพาณิชย์':               1448.04,
  };

  // Pull all accounts with assets from Neon
  const accounts = await prisma.account.findMany({
    include: { asset: true, bank: true }
  });

  console.log('\n========================================================');
  console.log('          BALANCE COMPARISON: REAL vs NEON DB');
  console.log('========================================================');
  console.log(
    'บัญชี'.padEnd(30),
    'ยอดจริง'.padStart(14),
    'Neon DB'.padStart(14),
    'Diff'.padStart(12),
    'Status'
  );
  console.log('--------------------------------------------------------');

  let totalDiff = 0;

  for (const [name, realAmount] of Object.entries(realBalances)) {
    // Find matching account (partial match)
    const acc = accounts.find(a => a.name.includes(name) || name.includes(a.name));
    const neonAmount = acc?.asset?.amount ?? null;

    if (neonAmount === null) {
      console.log(
        name.padEnd(30),
        realAmount.toFixed(2).padStart(14),
        'NOT FOUND'.padStart(14),
        '?'.padStart(12),
        '❌'
      );
    } else {
      const diff = neonAmount - realAmount;
      totalDiff += diff;
      const status = Math.abs(diff) < 0.01 ? '✅' : (diff > 0 ? '⬆️ DB สูงกว่า' : '⬇️ DB ต่ำกว่า');
      console.log(
        name.padEnd(30),
        realAmount.toFixed(2).padStart(14),
        neonAmount.toFixed(2).padStart(14),
        diff.toFixed(2).padStart(12),
        status
      );
    }
  }

  console.log('========================================================');
  console.log('Total Net Diff (Neon - Real):'.padEnd(44), totalDiff.toFixed(2).padStart(12));
  console.log('========================================================\n');

  await prisma.$disconnect();
}

main();
