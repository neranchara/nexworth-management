import { PrismaClient } from '@prisma/client';

const dbs = ['prod_nexworth_db', 'stg_nexworth_db', 'postgres'];

async function main() {
  for (const db of dbs) {
    const url = `postgresql://postgres:nop@ssw0rd@localhost:5432/${db}?schema=public`;
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    
    try {
      const accs = await prisma.account.findMany({
        where: { name: 'กสิกร โอนภายใน' }
      });
      
      if (accs.length > 0) {
        console.log(`DB [${db}] has กสิกร โอนภายใน. AccNum: ${accs[0].accountNumber}`);
        // Update it while we are here!
        if (accs[0].accountNumber !== '2011874579') {
           await prisma.account.updateMany({
             where: { OR: [{ name: { startsWith: 'Cloud Pocket' } }, { name: 'กสิกร โอนภายใน' }] },
             data: { accountNumber: '2011874579' }
           });
           console.log(`-> UPDATED DB [${db}] to 2011874579`);
        }
      } else {
        console.log(`DB [${db}] does not have this account.`);
      }
    } catch (e) {
      console.log(`DB [${db}] failed or not found.`);
    } finally {
      await prisma.$disconnect();
    }
  }
}

main();
