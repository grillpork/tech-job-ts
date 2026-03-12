
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully.');
    const count = await prisma.user.count();
    console.log(`✅ Database query successful. Found ${count} users.`);
  } catch (error) {
    console.error('❌ Failed to connect to database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
