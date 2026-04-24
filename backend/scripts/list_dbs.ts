import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:nop@ssw0rd@localhost:5432/postgres?schema=public' } } });
  const result: any[] = await prisma.$queryRawUnsafe('SELECT datname FROM pg_database');
  console.log('--- ALL DATABASES ---');
  console.log(result.map(r => r.datname));
}

main().finally(() => prisma.$disconnect());
