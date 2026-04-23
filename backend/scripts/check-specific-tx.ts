
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { 
      id: { in: ['6492207b-7dba-45ef-8b65-59d77b39c073', '4596ec39-cf78-4274-901a-f8441b25b733', '1b849d83-98bf-4750-ae8a-50b715813a69', 'b28fe561-85a5-4186-9851-1d3de4d0db5e'] }
    },
    include: { category: { include: { type: true } }, account: true }
  });

  console.log(JSON.stringify(txs.map(t => ({ id: t.id, desc: t.description, amount: t.amount, account: t.account.name, linkedId: t.linkedTransactionId, category: t.category.name, behavior: t.category.type.behavior })), null, 2));
}

main().finally(() => prisma.$disconnect());
