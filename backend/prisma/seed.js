import { PrismaClient } from '../src/generated/client/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding (JS) ---');

  console.log('Cleaning up existing data...');
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.transactionCategory.deleteMany();
  await prisma.bank.deleteMany();
  
  console.log('Seeding roles...');
  const roles = ['Admin', 'Production User', 'Officer', 'Guest'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });

  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexworth.local' },
    update: { passwordHash: hashedPassword, roleId: adminRole.id },
    create: {
      email: 'admin@nexworth.local',
      passwordHash: hashedPassword,
      firstName: 'Nexworth',
      lastName: 'Admin',
      roleId: adminRole.id,
    },
  });

  console.log('Seeding master banks...');
  const initialBanks = [
    { name: 'ธนาคารกรุงเทพ', code: 'BBL' },
    { name: 'ธนาคารไทยพาณิชย์', code: 'SCB' },
    { name: 'ธนาคารกสิกรไทย', code: 'KBANK' },
    { name: 'ธนาคารกรุงไทย', code: 'KTB' },
    { name: 'ธนาคารออมสิน', code: 'GSB' },
    { name: 'เกียรตินาคินภัทร', code: 'KKP' },
    { name: 'ธนาคารยูโอบี', code: 'UOB' },
  ];

  for (const bank of initialBanks) {
    await prisma.bank.create({
      data: { name: bank.name, code: bank.code }
    });
  }
  const seededBanks = await prisma.bank.findMany();
  const getBankId = (code) => seededBanks.find(b => b.code === code)?.id;

  console.log('Seeding accounts for admin...');
  const initialAccounts = [
    { name: 'บัญชีหลัก (กรุงเทพ)', type: 'CASHFLOW', bankCode: 'BBL' },
    { name: 'ไทยพาณิชย์', type: 'CASHFLOW', bankCode: 'SCB' },
    { name: 'กสิกร (K-Plus)', type: 'CASHFLOW', bankCode: 'KBANK' },
    { name: 'ออมสิน สำรองครอบครัว', type: 'EMERGENCY', bankCode: 'GSB' },
    { name: 'ออมสิน บัญชีเงินซื้อรถ', type: 'GOAL', bankCode: 'GSB' },
    { name: 'Cloud Pocket เที่ยว', type: 'GOAL', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ค่าใช้จ่ายรถ', type: 'GOAL', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ASML', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket TSMC', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket กองทุนกสิกร', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ออมทอง', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket เมล็ดกาแฟ', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ทำบุญ', type: 'GOAL', bankCode: 'KBANK' },
    { name: 'ออมสิน เงินออมแม่', type: 'SAVING', bankCode: 'GSB' },
    { name: 'กรุงไทย รายเดือนแม่', type: 'FAMILY', bankCode: 'KTB' },
    { name: 'ออมสิน รายเดือนแม่', type: 'FAMILY', bankCode: 'GSB' },
    { name: 'บัตรเครดิต UOB', type: 'LIABILITY', bankCode: 'UOB' },
    { name: '6163032', type: 'INVESTMENT', bankCode: 'KKP' },
    { name: 'Dime', type: 'INVESTMENT', bankCode: 'KKP' },
  ];

  for (const acc of initialAccounts) {
    await prisma.account.create({
      data: {
        userId: admin.id,
        name: acc.name,
        type: acc.type,
        bankId: getBankId(acc.bankCode),
        balance: 0,
      }
    });
  }
  const seededAccounts = await prisma.account.findMany({ where: { userId: admin.id } });
  const getAccountId = (name) => seededAccounts.find(a => a.name === name)?.id;

  console.log('Seeding categories...');
  const categories = [
    { name: 'เงินเดือน', type: 'INCOME' },
    { name: 'รายได้อื่น', type: 'INCOME' },
    { name: 'เงินออม', type: 'INCOME' },
    { name: 'เงินซื้อรถ', type: 'INCOME' },
    { name: 'ค่าใช้จ่ายประจำ', type: 'EXPENSE' },
    { name: 'ค่าใช้จ่ายส่วนตัว', type: 'EXPENSE' },
    { name: 'ค่าใช้จ่ายส่วนตัว', type: 'INTERNAL_TRANSFER' },
    { name: 'ครอบครัว', type: 'EXPENSE' },
    { name: 'ท่องเที่ยว', type: 'SAVING_INVESTMENT' }, 
    { name: 'ค่าใช้จ่ายรถ', type: 'SAVING_INVESTMENT' },
    { name: 'บริจาค', type: 'SAVING_INVESTMENT' },
    { name: 'ลงทุนหุ้น', type: 'SAVING_INVESTMENT' },
    { name: 'ลงทุนทอง', type: 'SAVING_INVESTMENT' },
    { name: 'ลงทุนธุรกิจ', type: 'SAVING_INVESTMENT' },
    { name: 'ชำระหนี้', type: 'DEBT' },
  ];

  for (const cat of categories) {
    await prisma.transactionCategory.create({
      data: { name: cat.name, type: cat.type }
    });
  }
  const seededCategories = await prisma.transactionCategory.findMany();
  const getCategoryId = (name, type) => seededCategories.find(c => c.name === name && c.type === type)?.id;

  console.log('Seeding 13 starting balance transactions...');
  const startData = [
    { date: '2026-03-06', type: 'INCOME', category: 'เงินออม', account: 'ออมสิน สำรองครอบครัว', amount: 40287.38, desc: '' },
    { date: '2026-03-06', type: 'INCOME', category: 'เงินซื้อรถ', account: 'ออมสิน บัญชีเงินซื้อรถ', amount: 141032.08, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนหุ้น', account: 'Cloud Pocket กองทุนกสิกร', amount: 14006.14, desc: 'K-US500X-A(A)' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ท่องเที่ยว', account: 'Cloud Pocket เที่ยว', amount: 1000.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ค่าใช้จ่ายรถ', account: 'Cloud Pocket ค่าใช้จ่ายรถ', amount: 2000.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนหุ้น', account: 'Cloud Pocket ASML', amount: 1000.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนหุ้น', account: 'Cloud Pocket TSMC', amount: 0.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนทอง', account: 'Cloud Pocket ออมทอง', amount: 3000.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนธุรกิจ', account: 'Cloud Pocket เมล็ดกาแฟ', amount: 1074.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'บริจาค', account: 'Cloud Pocket ทำบุญ', amount: 200.00, desc: '' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนหุ้น', account: '6163032', amount: 24206.47, desc: '6163032' },
    { date: '2026-03-06', type: 'SAVING_INVESTMENT', category: 'ลงทุนหุ้น', account: 'Dime', amount: 3057.73, desc: 'Dime' },
    { date: '2026-03-06', type: 'INTERNAL_TRANSFER', category: 'ค่าใช้จ่ายส่วนตัว', account: 'ออมสิน บัญชีเงินซื้อรถ', amount: 10000.00, desc: 'มดสร้างบ้าน' },
  ];

  for (const tx of startData) {
    const accountId = getAccountId(tx.account);
    const categoryId = getCategoryId(tx.category, tx.type);

    if (accountId && categoryId) {
      await prisma.transaction.create({
        data: {
          userId: admin.id,
          accountId,
          categoryId,
          amount: tx.amount,
          description: tx.desc,
          date: new Date(tx.date),
        }
      });
    }
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
