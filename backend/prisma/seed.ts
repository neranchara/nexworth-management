import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : 
               process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Cleanup ALL existing data (to ensure 100% clean state)
  console.log('Cleaning up existing data...');
  // 1. Cleanup ALL existing data (to ensure 100% clean state)
  console.log('Cleaning up existing data...');
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.transactionCategory.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  
  // 2. Seed Organization
  console.log('Seeding default organization...');
  const org = await prisma.organization.create({
    data: { name: 'neranchara' }
  });

  // 3. Seed Roles
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

  // 4. Seed Admin User
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('w,j,uP@ssw0rd', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'neranchara.ksr@gmail.com',
      passwordHash: hashedPassword,
      firstName: 'Nexworth',
      lastName: 'Admin',
      roleId: adminRole!.id,
      organizationId: org.id
    },
  });

  // 5. Seed Banks
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
      data: { name: bank.name, code: bank.code, organizationId: org.id }
    });
  }
  const seededBanks = await prisma.bank.findMany({ where: { organizationId: org.id } });
  const getBankId = (code: string) => seededBanks.find(b => b.code === code)?.id;

  // 6. Seed Accounts for Admin (From Image)
  console.log('Seeding accounts from image...');
  const productionAccounts = [
    { name: 'บัญชีหลัก (กรุงเทพ)', type: 'CASHFLOW', bankCode: 'BBL' },
    { name: 'ไทยพาณิชย์', type: 'CASHFLOW', bankCode: 'SCB' },
    { name: 'กสิกร โอนภายใน', type: 'INTERNAL', bankCode: 'KBANK' },
    { name: 'ออมสิน สำรองครอบครัว', type: 'EMERGENCY', bankCode: 'GSB' },
    { name: 'ออมสิน บัญชีเงินซื้อรถ', type: 'GOAL', bankCode: 'GSB' },
    { name: 'Cloud Pocket เที่ยว', type: 'GOAL', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ค่าใช้จ่ายรถ', type: 'GOAL', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ASML', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket TSMC', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket กองทุนกสิกร', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket ออมทอง', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'Cloud Pocket เมล็ดกาแฟ', type: 'INVESTMENT', bankCode: 'KBANK' },
    { name: 'ออมสิน เงินออมแม่', type: 'SAVING', bankCode: 'GSB' },
    { name: 'กรุงไทย รายเดือนแม่', type: 'FAMILY', bankCode: 'KTB' },
    { name: 'ออมสิน รายเดือนแม่', type: 'FAMILY', bankCode: 'GSB' },
    { name: 'บัตรเครดิต UOB', type: 'LIABILITY', bankCode: 'UOB' },
    { name: '6163032', type: 'INVESTMENT', bankCode: 'KKP' },
    { name: 'Dime', type: 'INVESTMENT', bankCode: 'KKP' },
  ];

  for (const acc of productionAccounts) {
    await prisma.account.create({
      data: {
        userId: admin.id,
        organizationId: org.id,
        name: acc.name,
        accountNumber: '000-000-0000',
        type: acc.type as any,
        bankId: getBankId(acc.bankCode),
      }
    });
  }

  // 7. Seed Transaction Types (Dynamic)
  console.log('Seeding transaction types...');
  const typeData = [
    { name: 'รายรับ', behavior: 'INCOME' },
    { name: 'รายจ่าย', behavior: 'EXPENSE' },
    { name: 'ออม/ลงทุน', behavior: 'SAVING' },
    { name: 'โอนภายใน', behavior: 'INTERNAL_TRANSFER' },
    { name: 'หนี้', behavior: 'DEBT' },
    { name: 'ยืมเงินภายใน', behavior: 'LOAN_BORROW' },
    { name: 'คืนเงินภายใน', behavior: 'LOAN_REPAY' },
    { name: 'เงินมีเป้าหมาย', behavior: 'GOAL_SAVING' },
  ];

  for (const t of typeData) {
    await prisma.transactionType.create({
      data: { name: t.name, behavior: t.behavior as any, organizationId: org.id }
    });
  }
  const seededTypes = await prisma.transactionType.findMany({ where: { organizationId: org.id } });
  const getTypeId = (name: string) => seededTypes.find(t => t.name === name)?.id;
  const getTypeByBehavior = (behavior: string) => seededTypes.find(t => t.behavior === behavior)?.id;

  // 8. Seed Categories (From Image)
  console.log('Seeding categories from image...');
  const categoryData = [
    // รายรับ
    { name: 'เงินเดือน', typeName: 'รายรับ' },
    { name: 'รายได้อื่น', typeName: 'รายรับ' },
    
    // รายจ่าย
    { name: 'ค่าใช้จ่ายประจำ', typeName: 'รายจ่าย' },
    { name: 'ค่าใช้จ่ายส่วนตัว', typeName: 'รายจ่าย' },
    { name: 'ครอบครัว', typeName: 'รายจ่าย' },
    
    // ออม/ลงทุน
    { name: 'ท่องเที่ยว', typeName: 'ออม/ลงทุน' },
    { name: 'ค่าใช้จ่ายรถ', typeName: 'ออม/ลงทุน' },
    { name: 'บริจาค', typeName: 'ออม/ลงทุน' },
    { name: 'เงินออม', typeName: 'ออม/ลงทุน' },
    { name: 'เงินฉุกเฉิน', typeName: 'ออม/ลงทุน' },
    { name: 'เงินซื้อรถ', typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนหุ้น', typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนทอง', typeName: 'ออม/ลงทุน' },
    { name: 'ลงทุนธุรกิจ', typeName: 'ออม/ลงทุน' },
    
    // หนี้
    { name: 'ชำระหนี้', typeName: 'หนี้' },

    // Special types for Loan logic
    { name: 'ยืมเงิน', typeBehavior: 'LOAN_BORROW' },
    { name: 'คืนเงิน', typeBehavior: 'LOAN_REPAY' }
  ];

  for (const cat of categoryData) {
    const typeId = cat.typeName ? getTypeId(cat.typeName) : getTypeByBehavior(cat.typeBehavior!);
    if (typeId) {
      await prisma.transactionCategory.create({
        data: { name: cat.name, typeId, organizationId: org.id }
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
