const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const job = await prisma.job.findFirst({where: {title: "E2E Test Job"}});
  if (!job) { console.log("Job not found"); return; }
  console.log("Job ID:", job.id);
  const res = await fetch(`http://localhost:3000/api/jobs/${job.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" })
  });
  const text = await res.text();
  console.log("API Response Status:", res.status);
  console.log("API RAW Response:", text);

  // cleanup
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.inventory.deleteMany({ where: { name: "TEST_TOOL_E2E" } });
}
run().catch(console.error).finally(() => prisma.$disconnect());
