import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    const roles = [
        { name: 'Admin', description: 'All Access Administrator' },
        { name: 'Guest', description: 'Read-only dashboard access' },
        { name: 'Assistant', description: 'Operates on assigned tasks' },
        { name: 'Production User', description: 'Production floor operations' },
        { name: 'Officer', description: 'Financial & invoice operations' },
    ];
    console.log('Start seeding roles...');
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }
    console.log('Roles seeded.');
    // Check if Admin exists, if not, create default admin
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    if (adminRole) {
        const adminEmail = 'admin@nexworth.local';
        const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!adminExists) {
            const passwordHash = await bcrypt.hash('admin123', 10);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash,
                    firstName: 'System',
                    lastName: 'Administrator',
                    roleId: adminRole.id,
                }
            });
            console.log('Default admin seeded. (admin@nexworth.local / admin123)');
        }
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
