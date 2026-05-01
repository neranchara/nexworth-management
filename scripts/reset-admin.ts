import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
// Load all dependencies from backend node_modules
const dotenv = require('../backend/node_modules/dotenv');
const bcrypt = require('../backend/node_modules/bcrypt');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function main() {
  console.log('--- Resetting Super Admin Password on Production ---');
  
  // Load Production Env using backend's dotenv
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.production'), override: true });
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in backend/.env.production');
    return;
  }

  const prisma = new PrismaClient();
  
  try {
    const email = 'superadmin@nexworth.online';
    const newPassword = 'superpassword123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Find master org first (System Management)
    const masterOrg = await prisma.organization.findFirst({ where: { name: 'System Management' } });
    
    if (!masterOrg) {
      console.warn('⚠️ Warning: Master Organization "System Management" not found. Proceeding without org binding.');
    }
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        isActive: true,
        organizationId: masterOrg?.id
      },
      create: {
        email,
        passwordHash: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        isSystemAdmin: true,
        organizationId: masterOrg?.id
      }
    });
    
    console.log(`✅ Success! Password for ${email} has been reset to: ${newPassword}`);
    console.log(`User ID: ${user.id}`);
    console.log(`New Hash: ${user.passwordHash}`);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
