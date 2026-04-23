
import { PrismaClient } from '../src/generated/client/index.js';

async function main() {
  const existingId = 'cc2c2b6c-d162-4e98-b04a-452d70a527e5';
  
  // Find "เงินเดือน" account to use as fromAccountId
  const fromAccId = 'SOME_SOURCE_ACCOUNT_ID'; // Just a dummy string? No, needs real ID to not violate FK.
  
  const prisma = new PrismaClient();
  const acc = await prisma.account.findFirst();
  
  console.log("Found an account to use as source:", acc!.id);

  const body = {
    fromAccountId: acc!.id,
    toAccountId: '4c0cac9c-1cc3-4732-bc76-0244a90f3a3f', // Main Bank
    categoryId: '85ae760d-31e6-444c-b392-431fa86ff590', // ลงทุนหุ้น
    typeId: '5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d', // ลงทุน
    amount: 1759,
    date: new Date().toISOString()
  };

  const response = await fetch(`http://localhost:4000/api/transactions/${existingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      // We need auth header?
    },
    body: JSON.stringify(body)
  });

  console.log("Status:", response.status);
  console.log("Response:", await response.text());
  await prisma.$disconnect();
}

main().catch(console.error);
