const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.user.create({
      data: {
        name: "Test User",
        email: "test.fail@example.com",
        password: "hashed_pwd",
        role: "employee",
        skills: "[]",
        joinedAt: "2024-05-12"
      }
    });
    console.log("Success with short date");
  } catch (e) {
    console.error("Error with short date:", e.message);
  }
}
test().finally(()=>prisma.$disconnect());
