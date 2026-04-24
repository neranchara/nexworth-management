import { PrismaClient } from '@prisma/client';

async function main() {
  const commonDbs = ['prod_nexworth_db', 'stg_nexworth_db', 'nexworth', 'nexworth_db', 'postgres'];
  
  for (const db of commonDbs) {
    const url = `postgresql://postgres:nop@ssw0rd@localhost:5432/${db}?schema=public`;
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    
    try {
      const accs = await prisma.account.findMany({
        where: { name: { contains: 'Cloud Pocket' } }
      });
      
      if (accs.length > 0) {
        console.log(`BINGO! Found ${accs.length} accounts in DB: ${db}`);
        accs.forEach(a => console.log(` - ${a.name}: ${a.accountNumber}`));
      }
    } catch (e) {} finally {
      await prisma.$disconnect();
    }
  }
}

main();
