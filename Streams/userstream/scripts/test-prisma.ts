import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Checking database connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Connection successful. User count: ${userCount}`);
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
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
