import { PrismaClient } from '../src/generated/client/index.js';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'nexworth-super-secret-jwt-key-2024'; 

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'neranchara.ksr@gmail.com' },
    include: { role: true, organization: true }
  });

  if (!user) {
    console.error('User not found');
    return;
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role?.name || 'Admin',
    orgId: user.organizationId,
    orgName: user.organization?.name || 'neranchara'
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
  console.log('Test Token Generated');

  try {
    const response = await fetch('http://localhost:3001/api/v1/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Call Failed (${response.status}):`, errorText);
        return;
    }

    const data = await response.json();
    console.log('Dashboard Stats Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('API Call Failed:', err.message);
  }
}

test().finally(() => prisma.$disconnect());
