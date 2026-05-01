import dotenv from 'dotenv';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Load all from backend node_modules
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const bcrypt = require('../backend/node_modules/bcrypt');

async function main() {
  console.log('--- Checking User Data in Production Database ---');
  
  // Load Production Env
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.production'), override: true });
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in backend/.env.production');
    return;
  }

  const prisma = new PrismaClient();
  
  try {
    const email = 'superadmin@nexworth.online';
    const passwordToTest = 'superpassword123';
    
    console.log(`Checking for user: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });
    
    if (!user) {
      console.log('❌ Result: User NOT FOUND in database!');
      return;
    }
    
    console.log('✅ Result: User FOUND');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email (Stored): "${user.email}"`);
    console.log(`- Is Active: ${user.isActive}`);
    console.log(`- Organization: ${user.organization?.name || 'None'}`);
    console.log(`- Password Hash (Stored): ${user.passwordHash}`);
    
    // Test Comparison
    console.log(`\n--- Testing Bcrypt Comparison ---`);
    console.log(`Testing with password: "${passwordToTest}"`);
    
    const isMatch = await bcrypt.compare(passwordToTest, user.passwordHash);
    
    if (isMatch) {
      console.log('✅ BCRYPT MATCH: Success! This password is correct for this hash.');
    } else {
      console.log('❌ BCRYPT MISMATCH: The password does not match the stored hash.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
