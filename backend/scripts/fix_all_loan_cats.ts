import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

const CATEGORY_NAMES = [
  { name: 'ยืมเงินภายใน', typeName: 'ยืมเงินภายใน' },
  { name: 'เงินฉุกเฉิน', typeName: 'ยืมเงินภายใน' },
];

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production'), override: true });
  const prisma = new PrismaClient();
  
  const user = await prisma.user.findFirst({
    where: { email: 'neranchara.ksr@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }

  // Fix all LOAN_BORROW types too
  const borrowTypes = await prisma.transactionType.findMany({
    where: { behavior: 'LOAN_BORROW' }
  });

  console.log(`Found ${borrowTypes.length} LOAN_BORROW types`);

  for (const t of borrowTypes) {
    // Ensure "ยืมเงินภายใน" category exists for each LOAN_BORROW type
    const exists = await prisma.transactionCategory.findFirst({
      where: { 
        name: t.name,  // match category name to type name
        typeId: t.id
      }
    });

    if (!exists) {
      try {
        await prisma.transactionCategory.create({
          data: {
            organizationId: user.organizationId,
            typeId: t.id,
            name: t.name  // use the type's own name as category name
          }
        });
        console.log(`Created "${t.name}" category for Type ID: ${t.id}`);
      } catch (e) {
        console.log(`Skipped (may already exist with different org): ${t.name} - ${t.id}`);
      }
    } else {
      console.log(`OK: "${t.name}" category already exists for Type ID: ${t.id}`);
    }
  }

  // Also fix LOAN_REPAY types
  const repayTypes = await prisma.transactionType.findMany({
    where: { behavior: 'LOAN_REPAY' }
  });

  console.log(`\nFound ${repayTypes.length} LOAN_REPAY types`);

  for (const t of repayTypes) {
    const exists = await prisma.transactionCategory.findFirst({
      where: { 
        name: t.name,
        typeId: t.id
      }
    });

    if (!exists) {
      try {
        await prisma.transactionCategory.create({
          data: {
            organizationId: user.organizationId,
            typeId: t.id,
            name: t.name
          }
        });
        console.log(`Created "${t.name}" category for Type ID: ${t.id}`);
      } catch (e) {
        console.log(`Skipped: ${t.name} - ${t.id}`);
      }
    } else {
      console.log(`OK: "${t.name}" category already exists for Type ID: ${t.id}`);
    }
  }

  console.log('\nAll loan categories fixed!');
  await prisma.$disconnect();
}

main();
