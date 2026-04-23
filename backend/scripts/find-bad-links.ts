
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({ 
    where: { linkedTransactionId: { not: null } }, 
    include: { 
      category: { include: { type: true } },
      account: true
    } 
  });

  const transferBehaviors = ['INTERNAL_TRANSFER', 'SAVING', 'INVESTMENT', 'LOAN_BORROW', 'LOAN_REPAY', 'GOAL_SAVING'];
  
  const bad = txs.filter(t => !transferBehaviors.includes(t.category.type.behavior));
  
  console.log('BAD_LINKS_FOUND');
  console.log(JSON.stringify(bad.map(b => ({ 
    id: b.id, 
    desc: b.description, 
    account: b.account.name,
    cat: b.category.name, 
    behavior: b.category.type.behavior,
    linkedId: b.linkedTransactionId
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
