
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Account Restoration ---');
  
  const accounts = await prisma.account.findMany();
  const accMap = new Map(accounts.map(a => [a.name.toLowerCase(), a.id]));

  // Find unlinked transactions that look like transfers
  const txs = await prisma.transaction.findMany({
    where: { 
      linkedTransactionId: null,
      OR: [
        { category: { name: 'โอนออกภายใน' } },
        { description: { contains: 'Cloud Pocket' } },
        { description: { contains: 'ออม' } }
      ]
    },
    include: { category: { include: { type: true } } }
  });

  console.log(`Checking ${txs.length} candidate transactions for restoration...`);

  const incomeType = await prisma.transactionType.findFirst({ where: { behavior: 'INCOME' } });
  let transferInCat = await prisma.transactionCategory.findFirst({ where: { name: 'โอนเข้าภายใน' } });

  for (const t of txs) {
    // Skip Mom's stuff as requested
    if (t.description.includes('แม่') || t.category.name === 'รายจ่ายครอบครัว') continue;

    // Try to find destination account in description
    let destAccId: string | undefined;
    for (const [name, id] of accMap) {
       if (t.description.toLowerCase().includes(name)) {
         destAccId = id;
         break;
       }
    }

    if (destAccId && destAccId !== t.accountId) {
       console.log(`Restoring Link for: ${t.description} -> Account ID: ${destAccId}`);
       
       // Create Income leg
       const newLeg = await prisma.transaction.create({
         data: {
           accountId: destAccId,
           categoryId: transferInCat!.id,
           typeId: incomeType!.id,
           amount: t.amount,
           description: t.description,
           date: t.date,
           actualDate: t.actualDate,
           userId: t.userId,
           organizationId: t.organizationId,
           linkedTransactionId: t.id
         }
       });

       // Update primary link
       await prisma.transaction.update({
         where: { id: t.id },
         data: { linkedTransactionId: newLeg.id }
       });
    }
  }

  console.log('--- Restoration Completed ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
