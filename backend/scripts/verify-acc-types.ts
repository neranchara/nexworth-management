
import { PrismaClient } from '../src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const accs = await prisma.account.findMany({
    where: { 
      name: { in: ['ออมสิน บัญชีเงินซื้อรถ', 'บัญชีหลัก (กรุงเทพ)'] }
    }
  });
  console.log("Accounts:");
  console.table(accs.map(a => ({ name: a.name, type: a.type })));
}

main().finally(() => prisma.$disconnect());
