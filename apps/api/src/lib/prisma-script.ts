// NEX-BUG-18: For standalone one-off scripts (backfills, diagnostics) run via
// `npx tsx src/scripts/...`. The shared `lib/prisma.ts` client is unsuitable here -
// Prisma's generated client auto-loads `packages/database/.env` (hardcoded to local
// dev) and that silently wins over whatever DATABASE_URL is exported in the shell, so
// `$env:DATABASE_URL="<production>" npx tsx src/scripts/some-script.ts` was silently
// running against local staging instead. This builds a client with an explicit
// datasource override so the shell's DATABASE_URL is what actually gets used.
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in this shell session. Set it first, then re-run:');
  console.error('  PowerShell:  $env:DATABASE_URL="<connection string>"');
  console.error('  bash:        export DATABASE_URL="<connection string>"');
  process.exit(1);
}

export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

// Prints which database this process is actually talking to - never the credentials.
export async function logConnectedDatabase() {
  const rows = await prisma.$queryRawUnsafe<{ db: string }[]>('SELECT current_database() as db');
  console.log(`[prisma-script] connected to database: ${rows[0]?.db}`);
}
