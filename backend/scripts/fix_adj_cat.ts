import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();

  // Find the adjustment transaction we just created
  const tx = await prisma.transaction.findFirst({
    where: { description: { contains: 'ปรับยอดบัญชี: ค่าใช้จ่ายยิบย่อย' } },
    orderBy: { createdAt: 'desc' }
  });

  if (!tx) {
    console.log('Adjustment transaction not found');
    return;
  }

  // Find "ค่าใช้จ่ายส่วนตัว" category
  const cat = await prisma.transactionCategory.findFirst({
    where: { name: 'ค่าใช้จ่ายส่วนตัว' },
    include: { type: true }
  });

  if (!cat) {
    console.log('Category not found');
    return;
  }

  console.log(`Found category: ${cat.name} (Type: ${cat.type.name})`);

  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      categoryId: cat.id,
      typeId: cat.typeId
    }
  });

  console.log(`✅ Updated transaction to: Type=รายจ่าย, Category=ค่าใช้จ่ายส่วนตัว`);

  await prisma.$disconnect();
}

main();
