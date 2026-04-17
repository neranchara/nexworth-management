import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const userId = '6bbffd14-9ff7-4ac7-85eb-24f8b29122e0';
  const orgId = 'de39aa64-853c-4878-9557-190ffa970f68';

  // IDs Mapped from database
  const tTypes = {
    INCOME: 'a634ddc8-ac5f-41d8-8461-9b42f69102f6',
    EXPENSE: 'e9b974cf-b58c-4df5-aeb4-e3d312036f55',
    SAVING: 'befc4bc6-3447-4c7d-b714-6749d044cc29',
    TRANSFER: '57c6c069-26c3-4c0c-bd2f-3407feaee805',
    DEBT: 'ec231301-dd16-44ab-889e-09b5f71b0e0b'
  };

  const categories = {
    เงินเดือน: 'ad3e46f7-d158-4268-b2f9-8399d3909ad8',
    ค่าใช้จ่ายประจำ: '069e40c2-8ddf-4fa3-b259-9344d0551818',
    ลงทุนหุ้น: 'b627415f-30da-415c-95bf-65834dbb3415',
    เงินออม: '3e92a8a3-777d-4d52-a182-ed9eb67c7068',
    เงินซื้อรถ: '7dd41ba6-3384-424c-b44c-baac186ec2a3',
    ชำระหนี้: '3016d08f-8f52-4c6c-ac39-cea734692f14',
    ครอบครัว: 'cf2a2484-cb34-4478-a8e5-331bc779ab93',
    บริจาค: '1e88da14-5768-416a-b899-302f5a341159'
  };

  const accounts = {
    บัญชีหลัก_กรุงเทพ: '3fc35316-4aa9-437d-95ea-41c1571c3385',
    สำรองครอบครัว: 'de2fe296-1090-4585-9e17-2dcb5f92002d',
    เงินซื้อรถ: '3dcf849e-846a-4eed-ba47-a12fbdda64d9',
    ไทยพาณิชย์: 'aaf3bb22-ffc0-4eef-bbaa-7647d5dbb882',
    เงินออมแม่: 'ad0bb4c1-27dc-4e49-9c73-893e69e9ee43',
    รายเดือนแม่_กรุงไทย: 'bf2cf361-1620-4093-95c1-3708003ec4df',
    รายเดือนแม่_ออมสิน: '2f420242-deb3-43ff-9c6b-8a0507e57cec',
    UOB: '3201d92e-3bef-47b2-a2b3-709062593e0b'
  };

  const jan28 = new Date('2026-01-28T00:00:00Z');

  const transactions = [
    { date: jan28, amount: 58633.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.เงินเดือน, typeId: tTypes.INCOME, description: 'เงินเดือน' },
    { date: jan28, amount: 875.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ค่าใช้จ่ายประจำ, typeId: tTypes.EXPENSE, description: 'ประกันสังคม' },
    { date: jan28, amount: 1683.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ค่าใช้จ่ายประจำ, typeId: tTypes.EXPENSE, description: 'ภาษี' },
    { date: jan28, amount: 1759.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ลงทุนหุ้น, typeId: tTypes.SAVING, description: 'กองทุนสำรองเลี้ยงชีพ' },
    { date: jan28, amount: 2000.00, accountId: accounts.สำรองครอบครัว, categoryId: categories.เงินออม, typeId: tTypes.TRANSFER, description: 'คืนเงินบัญชีครอบครัว (ออมสิน 020125686467)' },
    { date: jan28, amount: 1000.00, accountId: accounts.สำรองครอบครัว, categoryId: categories.เงินออม, typeId: tTypes.SAVING, description: 'ออมเงินสด (ออมสิน 020125686467)' },
    { date: jan28, amount: 15000.00, accountId: accounts.เงินซื้อรถ, categoryId: categories.เงินซื้อรถ, typeId: tTypes.SAVING, description: 'บัญชีเงินซื้อรถ (ออมสิน)' },
    { date: jan28, amount: 4591.00, accountId: accounts.ไทยพาณิชย์, categoryId: categories.ชำระหนี้, typeId: tTypes.DEBT, description: 'Shopping (ไทยพาณิชย์)' },
    { date: jan28, amount: 1000.00, accountId: accounts.เงินออมแม่, categoryId: categories.ครอบครัว, typeId: tTypes.SAVING, description: 'บัญชีออมสินแม่ (ออมสิน)' },
    { date: jan28, amount: 5000.00, accountId: accounts.รายเดือนแม่_กรุงไทย, categoryId: categories.ครอบครัว, typeId: tTypes.EXPENSE, description: 'เงินเดือนแม่บัญชีกรุงไทย' },
    { date: jan28, amount: 7000.00, accountId: accounts.รายเดือนแม่_ออมสิน, categoryId: categories.ครอบครัว, typeId: tTypes.EXPENSE, description: 'เงินเดือนแม่บัญชีออมสิน' },
    { date: jan28, amount: 4300.00, accountId: accounts.UOB, categoryId: categories.ชำระหนี้, typeId: tTypes.DEBT, description: 'UOB' },
    { date: jan28, amount: 2670.72, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ค่าใช้จ่ายประจำ, typeId: tTypes.EXPENSE, description: 'ค่าโทรศัพท์ + ค่า Internet บ้าน' },
    { date: jan28, amount: 3000.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ค่าใช้จ่ายประจำ, typeId: tTypes.EXPENSE, description: 'ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ' },
    { date: jan28, amount: 1000.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ค่าใช้จ่ายประจำ, typeId: tTypes.EXPENSE, description: 'ค่าซื้อของรายเดือน' },
    { date: jan28, amount: 650.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.ค่าใช้จ่ายประจำ, typeId: tTypes.EXPENSE, description: 'ค่าน้ำดื่ม' },
    { date: jan28, amount: 500.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.บริจาค, typeId: tTypes.EXPENSE, description: 'ค่าไฟวัดกุดขอนแก่น' },
    { date: jan28, amount: 100.00, accountId: accounts.บัญชีหลัก_กรุงเทพ, categoryId: categories.บริจาค, typeId: tTypes.EXPENSE, description: 'มูลนิธิ บุ๋ม ปนัดดา' },
  ];

  console.log('Inserting Jan 2026 transactions...');
  for (const t of transactions) {
     const created = await prisma.transaction.create({
       data: {
         ...t,
         userId,
         organizationId: orgId
       }
     });
     console.log(`Inserted: ${created.description} (${created.amount})`);
  }

  console.log('Jan 2026 Seeding complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
