
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      date: {
        gte: new Date('2026-03-01'),
        lte: new Date('2026-03-31')
      }
    },
    include: {
      account: true,
      type: true,
      category: true
    }
  });
  
  const savings = txs.filter(tx => {
    const accType = tx.account?.type;
    const behavior = tx.type?.behavior;
    const catName = tx.category?.name;
    const isInternal = behavior === 'INTERNAL_TRANSFER' || (catName && catName.includes('โอน'));
    
    return (accType === 'SAVING' || accType === 'EMERGENCY') && 
           (isInternal || behavior === 'SAVING' || behavior === 'EMERGENCY');
  });

  console.log('MARCH SAVINGS TRANSACTIONS:');
  console.table(savings.map(s => ({
    date: s.date.toISOString().split('T')[0],
    description: s.description,
    amount: Number(s.amount),
    account: s.account?.name,
    category: s.category?.name
  })));
  
  const total = savings.reduce((sum, s) => sum + Number(s.amount), 0);
  console.log(`TOTAL SAVINGS: ${total.toLocaleString()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
