import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { setupOrganizationDefaults } from '../src/services/organization.service.js';

// โหลด Environment Variable (.env ของเครื่องที่รันสคริปต์)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : 
               process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const prisma = new PrismaClient();

async function main() {
  console.log(`--- Updating Permissions for All Organizations (${process.env.NODE_ENV || 'development'}) ---`);
  
  const orgs = await prisma.organization.findMany();
  let updatedCount = 0;
  
  for (const org of orgs) {
    // หา Role Admin ของ Org นั้น
    const adminRole = await prisma.role.findFirst({ 
      where: { organizationId: org.id, name: 'Admin' }
    });
    
    // หา User ที่เป็น Admin หรือใครก็ได้ใน Org เพื่อเป็นตัวตั้งต้นรับสิทธิ์
    const adminUser = await prisma.user.findFirst({ 
      where: { organizationId: org.id, roleId: adminRole?.id }
    }) || await prisma.user.findFirst({ 
      where: { organizationId: org.id }
    });

    if (adminUser) {
        console.log(`[Processing] Org: "${org.name}" | Admin Target: ${adminUser.email}`);
        // ฟังก์ชันนี้จะอัปเดต Role และเพิ่ม Permission ตัวใหม่ๆ เข้าไปให้ Admin
        await setupOrganizationDefaults(org.id, adminUser.id);
        updatedCount++;
    } else {
        console.log(`[Skipping] Org: "${org.name}" (No users found in this org)`);
    }
  }
  
  console.log(`--- Permissions Update Completed Successfully (${updatedCount} Orgs Updated) ---`);
}

main()
  .catch((e) => {
    console.error('Update Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
