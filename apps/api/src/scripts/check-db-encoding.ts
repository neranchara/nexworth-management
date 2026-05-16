import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`SHOW client_encoding;`;
    console.log('Client Encoding:', result);
    const result2 = await prisma.$queryRaw`SHOW server_encoding;`;
    console.log('Server Encoding:', result2);
    
    const banks = await prisma.$queryRaw`SELECT name FROM "Bank" LIMIT 1;`;
    console.log('Bank Name (Raw):', banks);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
