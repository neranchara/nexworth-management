import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres:nop@ssw0rd@localhost:5432/prod_nexworth_db?schema=public";

const prisma = new PrismaClient({
  datasources: {
    db: { url: DATABASE_URL }
  }
});

const USER_DATA = [
  { name: 'กสิกร โอนภายใน', real: 34876 },
  { name: 'ออมสิน สำรองครอบครัว', real: 69287.38 },
  { name: 'ออมสิน เงินออมแม่', real: 12000 },
  { name: 'ธนาคารอาคารสงเคราะห์', real: 178000 },
  { name: 'ออมสิน บัญชีเงินซื้อรถ', real: 346032.08 },
  { name: 'กรุงเทพ', real: 8368.97 },
  { name: 'ไทยพาณิชย์', real: 1448.04 },
];

async function compareBalances() {
  const orgName = 'neranchara';
  const org = await prisma.organization.findFirst({ where: { name: orgName } });
  
  if (!org) {
    console.error(`Organization ${orgName} not found!`);
    return;
  }

  const accounts = await prisma.account.findMany({
    where: { organizationId: org.id },
    include: {
      asset: true,
      liability: true,
    }
  });

  console.log(`\n--- BALANCE COMPARISON (ORG: ${org.name}) ---`);
  console.log('Database: prod_nexworth_db (Local)');
  console.log('------------------------------------------------------------------------------------------------');
  console.log('| Account Name                     | DB Balance      | Real Value      | Diff            |');
  console.log('------------------------------------------------------------------------------------------------');

  let totalDiff = 0;

  for (const userAcc of USER_DATA) {
    // Fuzzy match account name
    const dbAcc = accounts.find(a => 
      a.name.toLowerCase().replace(/\s/g, '').includes(userAcc.name.toLowerCase().replace(/\s/g, '')) || 
      userAcc.name.toLowerCase().replace(/\s/g, '').includes(a.name.toLowerCase().replace(/\s/g, ''))
    );

    if (dbAcc) {
      const dbBalance = (dbAcc.asset?.amount || 0) - (dbAcc.liability?.amount || 0);
      const diff = dbBalance - userAcc.real;
      totalDiff += Math.abs(diff);
      
      console.log(`| ${dbAcc.name.padEnd(32)} | ${dbBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }).padStart(15)} | ${userAcc.real.toLocaleString(undefined, { minimumFractionDigits: 2 }).padStart(15)} | ${diff.toLocaleString(undefined, { minimumFractionDigits: 2 }).padStart(15)} |`);
    } else {
      console.log(`| ${userAcc.name.padEnd(32)} | NOT FOUND       | ${userAcc.real.toLocaleString(undefined, { minimumFractionDigits: 2 }).padStart(15)} | -               |`);
    }
  }
  
  console.log('------------------------------------------------------------------------------------------------');
  console.log(`| Total Absolute Diff:                                                 | ${totalDiff.toLocaleString(undefined, { minimumFractionDigits: 2 }).padStart(15)} |`);
  console.log('------------------------------------------------------------------------------------------------\n');

  // List all other accounts in DB not matched
  const matchedIds = accounts.filter(a => USER_DATA.some(u => 
    a.name.toLowerCase().replace(/\s/g, '').includes(u.name.toLowerCase().replace(/\s/g, '')) || 
    u.name.toLowerCase().replace(/\s/g, '').includes(a.name.toLowerCase().replace(/\s/g, ''))
  )).map(a => a.id);
  
  const otherAccs = accounts.filter(a => !matchedIds.includes(a.id));
  
  if (otherAccs.length > 0) {
    console.log('--- OTHER ACCOUNTS IN DB (Non-zero) ---');
    for (const acc of otherAccs) {
      const bal = (acc.asset?.amount || 0) - (acc.liability?.amount || 0);
      if (Math.abs(bal) > 0.01) {
        console.log(`- ${acc.name.padEnd(32)}: ${bal.toLocaleString(undefined, { minimumFractionDigits: 2 }).padStart(15)}`);
      }
    }
  }
}

compareBalances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
