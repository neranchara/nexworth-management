import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const userId = '6bbffd14-9ff7-4ac7-85eb-24f8b29122e0';
  const orgId = 'de39aa64-853c-4878-9557-190ffa970f68';

  // IDs Mapped from database
  const tTypes = {
    INCOME: 'a634ddc8-ac5f-41d8-8461-9b42f69102f6',
    SAVING: 'befc4bc6-3447-4c7d-b714-6749d044cc29',
    TRANSFER: '57c6c069-26c3-4c0c-bd2f-3407feaee805'
  };

  const categories = {
    เงินออม: '3e92a8a3-777d-4d52-a182-ed9eb67c7068',
    เงินซื้อรถ: '7dd41ba6-3384-424c-b44c-baac186ec2a3',
    ลงทุนหุ้น: 'b627415f-30da-415c-95bf-65834dbb3415',
    ท่องเที่ยว: '5984a762-8ee9-4a48-87f0-efe25d09d5d2',
    ค่าใช้จ่ายรถ: '54d3a956-0baf-4adf-bcaa-46ac3de70a8c',
    ลงทุนทอง: '4bdf8bb7-a7e8-4fb0-a9e3-607e233d646f',
    ลงทุนธุรกิจ: 'd7972a56-e973-4d74-951d-61ed67cbab02',
    บริจาค: '1e88da14-5768-416a-b899-302f5a341159',
    ค่าใช้จ่ายส่วนตัว: '650da295-60c3-43cb-a14b-bf725f04e15c'
  };

  const accounts = {
    สำรองครอบครัว: 'de2fe296-1090-4585-9e17-2dcb5f92002d',
    เงินซื้อรถ: '3dcf849e-846a-4eed-ba47-a12fbdda64d9',
    กสิกร: 'fb77b143-72ce-46f6-ab8d-90d0754e3b8c',
    เที่ยว: 'e72880b4-b43e-4675-90e6-83b36e5ddcf3',
    ค่าใช้จ่ายรถ: '54e97d62-624f-4a61-8857-1b20fd4d648a',
    ASML: 'b0192b6e-cf41-435f-8acd-025c1df28f5b',
    TSMC: 'f7cfa3f8-3b8b-4424-ae30-251c4fa2fb8b',
    ออมทอง: 'c87eb2e1-7da0-4dd7-9129-faf50a2804d8',
    เมล็ดกาแฟ: '8a0b7b32-a7ba-4459-ac72-0c2707ff87a9',
    ทำบุญ: 'f2455633-5d0a-4923-bf59-a1dfe48f7f34',
    '6163032': 'bf7bd18d-1adc-42a1-b5cc-4f37f8181ab8',
    Dime: 'c7d77bf3-d5b9-49de-8572-7debce3d4a10'
  };

  const baseDate = new Date('2025-01-01T00:00:00Z');

  const transactions = [
    { date: baseDate, amount: 40287.38, accountId: accounts.สำรองครอบครัว, categoryId: categories.เงินออม, typeId: tTypes.INCOME, description: 'Initial Deposit' },
    { date: baseDate, amount: 141032.08, accountId: accounts.เงินซื้อรถ, categoryId: categories.เงินซื้อรถ, typeId: tTypes.INCOME, description: 'Initial Deposit' },
    { date: baseDate, amount: 14006.14, accountId: accounts.กสิกร, categoryId: categories.ลงทุนหุ้น, typeId: tTypes.SAVING, description: 'K-US500X-A(A)' },
    { date: baseDate, amount: 1000.00, accountId: accounts.เที่ยว, categoryId: categories.ท่องเที่ยว, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 2000.00, accountId: accounts.ค่าใช้จ่ายรถ, categoryId: categories.ค่าใช้จ่ายรถ, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 1000.00, accountId: accounts.ASML, categoryId: categories.ลงทุนหุ้น, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 0, accountId: accounts.TSMC, categoryId: categories.ลงทุนหุ้น, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 3000.00, accountId: accounts.ออมทอง, categoryId: categories.ลงทุนทอง, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 1074.00, accountId: accounts.เมล็ดกาแฟ, categoryId: categories.ลงทุนธุรกิจ, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 200.00, accountId: accounts.ทำบุญ, categoryId: categories.บริจาค, typeId: tTypes.SAVING, description: '' },
    { date: baseDate, amount: 24206.47, accountId: accounts['6163032'], categoryId: categories.ลงทุนหุ้น, typeId: tTypes.SAVING, description: '6163032' },
    { date: baseDate, amount: 3057.73, accountId: accounts.Dime, categoryId: categories.ลงทุนหุ้น, typeId: tTypes.SAVING, description: 'Dime' },
    { date: baseDate, amount: 10000.00, accountId: accounts.เงินซื้อรถ, categoryId: categories.ค่าใช้จ่ายส่วนตัว, typeId: tTypes.TRANSFER, description: 'มดสร้างบ้าน' },
  ];

  console.log('Inserting transactions...');
  for (const t of transactions) {
     const created = await prisma.transaction.create({
       data: {
         ...t,
         userId,
         organizationId: orgId
       }
     });
     console.log(`Inserted: ${created.amount} -> ${created.accountId}`);
  }

  console.log('Seeding complete. Remember to run balance sync script.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
