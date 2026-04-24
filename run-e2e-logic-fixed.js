const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runLogicTest() {
  console.log("🛠️ Starting E2E Backend Logic Test\n");
  
  const creator = await prisma.user.findFirst();
  
  // 1. Create a mock tool Inventory Item
  const tool = await prisma.inventory.create({
    data: {
      name: "TEST_TOOL_E2E_2",
      type: "ต้องคืน",
      quantity: 5,
      price: 100,
      status: "พร้อมใช้",
      location: "TEST",
    }
  });
  console.log(`✅ [1] Created Inventory '${tool.name}' | Type: 'ต้องคืน' | Qty: ${tool.quantity}`);

  // 2. Create a mock Job representing a task using this tool
  const job = await prisma.job.create({
    data: {
      title: "E2E Test Job 2",
      status: "pending_approval",
      creatorId: creator.id,
      // Simulate getting the tool approved
      inventoryStatus: "approved",
      usedInventory: JSON.stringify([{ id: tool.id, qty: 2 }])
    }
  });
  console.log(`✅ [2] Created Job '${job.title}' using 2 units of ${tool.name}.`);
  
  // 3. Simulate backend updating the job to "completed" via the API logic.
  console.log(`⏳ [3] Triggering Job Completion... (Should trigger auto-return logic)`);
  try {
     const res = await fetch(`http://localhost:3000/api/jobs/${job.id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ status: "completed" })
     });
     if (res.ok) {
        console.log(`✅ [4] API successfully marked Job as completed!`);
     } else {
        console.error(`❌ API Failed:`, await res.text());
     }
  } catch(e) {
     console.error(e);
  }

  // 4. Verify Database Stock again
  const toolAfter = await prisma.inventory.findUnique({ where: { id: tool.id } });
  if (toolAfter.quantity === 7) {
     console.log(`✅ [5] SUCCESS! Auto-return logic worked. Tool quantity was 5, 2 were used, auto-returned to 7.`);
  } else {
     console.error(`❌ [5] FAIL! Auto-return logic did not run properly. Tool quantity is ${toolAfter.quantity}, expected 7.`);
  }
  
  // Cleanup
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.inventory.delete({ where: { id: tool.id } });
  console.log(`\n🧹 [6] Cleaned up test data.`);
  
}
runLogicTest().catch(console.error).finally(() => prisma.$disconnect());
