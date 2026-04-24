import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();

  // 1. Find both accounts
  const bkkAcc = await prisma.account.findFirst({
    where: { name: { contains: 'บัญชีหลัก' } },
    include: { asset: true }
  });

  const kbankAcc = await prisma.account.findFirst({
    where: { name: { contains: 'กสิกร โอนภายใน' } },
    include: { asset: true }
  });

  if (!bkkAcc || !kbankAcc) {
    console.log('Account not found!');
    console.log('Bangkok:', bkkAcc?.name);
    console.log('KBank:', kbankAcc?.name);
    return;
  }

  const bkkBalance = bkkAcc.asset?.amount ?? 0;
  const kbankBalance = kbankAcc.asset?.amount ?? 0;

  console.log(`Before swap:`);
  console.log(`  ${bkkAcc.name}: ${bkkBalance}`);
  console.log(`  ${kbankAcc.name}: ${kbankBalance}`);

  // 2. Rename & change type of Bangkok account
  await prisma.account.update({
    where: { id: bkkAcc.id },
    data: {
      name: 'กรุงเทพ โอนภายใน',
      type: 'EMERGENCY'
    }
  });

  // 3. Rename KBank account
  await prisma.account.update({
    where: { id: kbankAcc.id },
    data: {
      name: 'กสิกร (เงินเดือน)'
    }
  });

  // 4. Swap asset balances
  if (bkkAcc.asset) {
    await prisma.asset.update({
      where: { accountId: bkkAcc.id },
      data: { amount: kbankBalance }
    });
  }

  if (kbankAcc.asset) {
    await prisma.asset.update({
      where: { accountId: kbankAcc.id },
      data: { amount: bkkBalance }
    });
  }

  console.log(`\nAfter swap:`);
  console.log(`  กรุงเทพ โอนภายใน (EMERGENCY): ${kbankBalance}`);
  console.log(`  กสิกร (เงินเดือน): ${bkkBalance}`);
  console.log('\n✅ Done!');

  await prisma.$disconnect();
}

main();
