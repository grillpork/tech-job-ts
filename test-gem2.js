const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.job.findMany({take: 20, select: {title: true, status: true}});
  const inventories = await prisma.inventory.findMany({take: 20, select: {name: true, quantity: true}});
  const recentJobs = jobs.map(j => `- Job: ${j.title} (${j.status})`).join("\n");
  const stockStr = inventories.map(inv => `- ${inv.name}: ${inv.quantity}`).join("\n");
  const question = "สรุปภาพรวมงานทั้งหมดให้หน่อย";
  const promptContext = `คุณคือผู้ช่วย AI ของระบบจัดการงานและคลังวัสดุ "STELLAR"\n[Jobs]\n${recentJobs}\n[Inventory]\n${stockStr}\n[คำถาม]\n${question}`;
  
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBuKlIkdwb9M4QLptMIJw-Fj8Ll0Vc1VnM";
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  const geminiRes = await fetch(geminiUrl, {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{parts: [{text: promptContext}]}],
      generationConfig: { maxOutputTokens: 800 }
    })
  });
  const data = await geminiRes.json();
  console.log(JSON.stringify(data, null, 2));
}
main();
