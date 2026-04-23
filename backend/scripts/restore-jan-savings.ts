
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      date: {
        gte: new Date('2026-01-01'),
        lt: new Date('2026-02-01')
      },
      linkedTransactionId: null,
      OR: [
        { description: { contains: '020125686467' } },
        { description: { contains: 'บัญชีเงินซื้อรถ' } }
      ]
    },
    include: { account: true, category: { include: { type: true } } }
  });

  console.log('Found transactions:');
  console.log(JSON.stringify(txs.map(t => ({ id: t.id, desc: t.description, amount: t.amount, account: t.account.name })), null, 2));

  const incomeType = await prisma.transactionType.findFirst({ where: { behavior: 'INCOME' } });
  let transferInCat = await prisma.transactionCategory.findFirst({ where: { name: 'โอนเข้าภายใน' } });

  for (const t of txs) {
    let destAccId = '';
    if (t.description.includes('020125686467')) {
       // "ออมสิน สำรองครอบครัว"
       destAccId = 'bdc303b8-199c-432d-9a43-2ceee54b4adf';
    } else if (t.description.includes('บัญชีเงินซื้อรถ')) {
       // "ออมสิน บัญชีเงินซื้อรถ"
       destAccId = 'bf76aa0f-db8a-4062-ba12-aaae5f06a479';
    }

    if (destAccId) {
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
}

main().finally(() => prisma.$disconnect());
