import prisma from '../lib/prisma.js';

async function main() {
  const legacy = await prisma.transactionType.count({ where: { name: 'ออม/ลงทุน', isActive: true } });
  const saving = await prisma.transactionType.count({ where: { name: 'ออม', behavior: 'SAVING', isActive: true } });
  const invest = await prisma.transactionType.count({ where: { name: 'ลงทุน', behavior: 'INVESTMENT', isActive: true } });
  console.log(JSON.stringify({ legacyActive: legacy, savingTypes: saving, investTypes: invest }, null, 2));
  const sample = await prisma.transactionCategory.findMany({
    where: { name: { in: ['เงินออม', 'ลงทุนหุ้น', 'ท่องเที่ยว', 'บริจาค'] }, isActive: true },
    include: { type: { select: { name: true, behavior: true } } },
    take: 16,
  });
  for (const c of sample) {
    console.log(`${c.name} -> ${c.type.name} (${c.type.behavior})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
