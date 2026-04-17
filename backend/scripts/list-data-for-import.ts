import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({ select: { id: true, name: true, type: true } });
  const categories = await prisma.transactionCategory.findMany({ select: { id: true, name: true, type: { select: { name: true, behavior: true } } } });
  const users = await prisma.user.findMany({ select: { id: true, organizationId: true, firstName: true } });

  console.log('--- ACCOUNTS ---');
  accounts.forEach(a => console.log(`${a.name} (${a.type}) -> ${a.id}`));
  console.log('--- CATEGORIES ---');
  categories.forEach(c => console.log(`${c.name} [Type: ${c.type.name}, Behavior: ${c.type.behavior}] -> ${c.id}`));
  console.log('--- USERS ---');
  users.forEach(u => console.log(`${u.firstName} -> ID: ${u.id}, OrgID: ${u.organizationId}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
