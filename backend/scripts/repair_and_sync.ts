import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  console.log('--- REPAIRING PVD AND SYNCING BALANCES (NEON) ---');

  // 1. Find and delete the "Excess" PVD transactions
  // Jan 28: Remove the one from ธอส (it was recorded as expense)
  const janExcess = await prisma.transaction.findFirst({
    where: {
      date: { gte: new Date('2026-01-28'), lte: new Date('2026-01-28T23:59:59Z') },
      account: { name: { contains: 'อาคารสงเคราะห์' } },
      description: { contains: 'กองทุนสำรองเลี้ยงชีพ' }
    }
  });
  if (janExcess) {
    await prisma.transaction.delete({ where: { id: janExcess.id } });
    console.log('Deleted Jan excess PVD from ธอส.');
  }

  // Feb 28: Remove one of the duplicates from BBL
  const febTxs = await prisma.transaction.findMany({
    where: {
      date: { gte: new Date('2026-02-28'), lte: new Date('2026-02-28T23:59:59Z') },
      account: { name: { contains: 'กรุงเทพ' } },
      description: { contains: 'กองทุนสำรองเลี้ยงชีพ' }
    }
  });
  if (febTxs.length > 1) {
    await prisma.transaction.delete({ where: { id: febTxs[0].id } });
    console.log('Deleted Feb duplicate PVD from กรุงเทพ.');
  }

  // 2. Update Balances (Force Calibration)
  const balances: Record<string, number> = {
    'กสิกร โอนภายใน': 34876.00,
    'ออมสิน สำรองครอบครัว': 69287.38,
    'ออมสิน เงินออมแม่': 12000.00,
    'ออมสิน บัญชีเงินซื้อรถ': 346032.08,
    'กรุงเทพ มด': 8368.97,
    'ไทยพาณิชย์': 1448.04,
    'ธนาคารอาคารสงเคราะห์': 3518.00 // PVD Calculated (1759 * 2)
  };

  for (const [name, amount] of Object.entries(balances)) {
    const acc = await prisma.account.findFirst({ where: { name: { contains: name } } });
    if (acc) {
      await prisma.asset.upsert({
        where: { accountId: acc.id },
        update: { amount },
        create: { accountId: acc.id, amount, userId: acc.userId, organizationId: acc.organizationId }
      });
      console.log(`Updated ${name} to ${amount}`);
    } else {
      console.log(`Could not find account: ${name}`);
    }
  }

  await prisma.$disconnect();
}

main();
