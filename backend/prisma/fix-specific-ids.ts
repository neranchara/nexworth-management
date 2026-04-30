import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Scanning Neon for specific target transactions ---');
  
  // Find transactions that meet the criteria
  const targets = await prisma.transaction.findMany({
    where: {
      linkedTransactionId: null,
      OR: [
        { category: { name: { contains: 'ยืม' } } },
        { category: { name: { contains: 'โอนออก' } } },
        { type: { behavior: 'LOAN_BORROW' } }
      ]
    },
    select: { id: true, category: { select: { name: true } } }
  });

  console.log(`Found ${targets.length} specific IDs to update.`);

  for (const target of targets) {
    console.log(`Updating Transaction ID: ${target.id} (Category: ${target.category.name}) -> FROM`);
    await prisma.transaction.update({
      where: { id: target.id },
      data: { direction: 'FROM' }
    });
  }

  console.log('--- Targeted Update Complete ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
