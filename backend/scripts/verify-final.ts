import { PrismaClient } from '../src/generated/client/index.js';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'nexworth-super-secret-jwt-key-2024';

async function test() {
  const accountId = '3201d92e-3bef-47b2-a2b3-709062593e0b'; // บัตรเครดิต UOB
  const user = await prisma.user.findUnique({
    where: { email: 'neranchara.ksr@gmail.com' },
    include: { organization: true, role: true }
  });

  const category = await prisma.transactionCategory.findFirst({
    where: { name: 'ค่าใช้จ่ายส่วนตัว' }
  });

  if (!user || !category) {
    console.error('User or Category not found');
    return;
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role?.name || 'Admin',
    orgId: user.organizationId,
    orgName: user.organization?.name
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

  console.log('--- Creating Transaction on Liability Account ---');
  
  try {
    const postRes = await fetch('http://localhost:3001/api/v1/transactions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: accountId,
        categoryId: category.id,
        amount: 500.50,
        description: 'Test Credit Card Spend',
        date: new Date().toISOString()
      })
    });

    if (!postRes.ok) {
        console.error('Failed to create transaction:', await postRes.text());
        return;
    }
    console.log('Transaction created successfully');

    // Check account balance in DB
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    console.log(`Account Balance in DB: ${account?.balance}`);

    // Check Dashboard stats
    const statsRes = await fetch('http://localhost:3001/api/v1/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = await statsRes.json();
    console.log(`Total Assets: ${stats.totalAssets}`);
    console.log(`Total Liabilities: ${stats.totalLiabilities}`);
    console.log(`Net Worth: ${stats.netWorth}`);

  } catch (err: any) {
    console.error('Test Failed:', err.message);
  }
}

test().finally(() => prisma.$disconnect());
