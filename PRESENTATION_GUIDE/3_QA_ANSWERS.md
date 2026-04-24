# ❓ Q&A — คำถามที่อาจถูกถามช่วงพรีเซนต์

---

## คำถามเรื่อง Database

**Q: ใช้ Database อะไร?**
> "ใช้ PostgreSQL บน Neon Cloud  
> Neon เป็น Serverless PostgreSQL — ไม่ต้องดูแล Server เอง  
> connect ผ่าน DATABASE_URL ใน .env"

**Q: ถ้าข้อมูลหายจะทำยังไง?**
> "Neon มี automatic backup ทุกวัน  
> และตัวโปรเจกต์มี schema.prisma เป็น blueprint  
> สามารถสร้าง table ใหม่ได้ด้วย `prisma db push`"

**Q: ทำไมไม่ใช้ MySQL?**
> "PostgreSQL รองรับ JSON field ได้ดีกว่า  
> เราใช้ JSON field เก็บ departments, usedInventory, tasks  
> และ Prisma support PostgreSQL ได้ครบกว่า"

---

## คำถามเรื่อง API

**Q: API ปลอดภัยไหม?**
> "ทุก endpoint ตรวจ Session ก่อน  
> ถ้าไม่มี Session → 401 ทันที  
> และเรามีการทำ **Dynamic RBAC check** โดยใช้ `startsWith('lead_')` เพื่ออนุญาตหัวหน้าจากแผนกต่างๆ เข้าถึงหน้าแอดมินตามแผนกตนเองได้ครับ"

**Q: ระบบจัดการสิทธิ์แยกตามระนาบ (Departmental RBAC) ทำงานยังไง?**
> "ระบบจะดึงแผนกจากตัวแปร `department` ของผู้ใช้ที่ล็อกอินอยู่  
> และใช้เป็นตัวกรองใน Database (Prisma) เพื่อดึงเฉพาะข้อมูล (เช่น Reports) ของแผนกนั้นๆ มาแสดงผล  
> ทำให้หัวหน้าช่างไฟฟ้าจะไม่เห็นรายงานของแผนกโยธา เพื่อความถูกต้องของข้อมูลครับ"

**Q: ถ้า Client ส่งข้อมูลผิด จะเกิดอะไร?**
> "Jobs API ใช้ Zod validate — ส่งกลับ 400 Bad Request  
> พร้อม error message ว่าผิดที่ field ไหน  
> ไม่มีทางหลุดไปถึง Database"

**Q: API ทำงานบน Server ไหน?**
> "Next.js App Router — API Routes รันบน Node.js Server  
> เมื่อ Deploy บน Vercel จะกลายเป็น Edge Functions อัตโนมัติ"

---

## คำถามเรื่อง Auth

**Q: Password เก็บยังไงใน DB?**
> "ใช้ bcrypt hash — password จริงๆ ไม่เคยเก็บลง DB  
> เก็บแค่ hash ที่ hash แล้ว 10 rounds"

**Q: Token หมดอายุยังไง?**
> "JWT มี exp claim — NextAuth handle อัตโนมัติ  
> Session จะ expire ตามที่ config ไว้"

**Q: ถ้า Token ถูก steal จะทำยังไง?**
> "ตอนนี้ใช้ JWT stateless — invalidate แบบ real-time ยากกว่า  
> แต่ในระบบจริงจะเพิ่ม refresh token + blacklist table"

---

## คำถามเรื่อง Architecture

**Q: Frontend กับ Backend แยกกันไหม?**
> "ในโปรเจกต์นี้อยู่ด้วยกันใน Next.js (Fullstack)  
> /app/dashboard = Frontend  
> /app/api = Backend  
> แยก deploy ได้ถ้าต้องการ"

**Q: Zustand คืออะไร ต่างจาก Redux ยังไง?**
> "Zustand เป็น State Management เหมือนกัน  
> แต่เขียนน้อยกว่า Redux มาก  
> ใน project นี้ใช้ Zustand แทน prop drilling  
> ทุก component เข้าถึง store ได้โดยตรง"

**Q: ทำไมต้องมี Store ล่ะ ดึง API ตรงๆ จาก Component ไม่ได้เหรอ?**
> "ได้ แต่จะ fetch ซ้ำทุกครั้งที่ component mount  
> Store เป็น singleton — fetch ครั้งเดียว แชร์ข้อมูลทุก component  
> Component A อัปเดต → Component B เห็นด้วยทันที โดยไม่ต้อง pass prop"

---

## คำถามเรื่อง Upload

**Q: รูปภาพเก็บไว้ที่ไหน?**
> "เก็บใน /public/uploads/ บน Server  
> แบ่งเป็น folder ตาม entity เช่น /uploads/inventory/[id]/filename.jpg  
> DB เก็บแค่ URL path ไม่ได้เก็บรูปจริง"

**Q: Deploy บน Vercel ได้ไหม? เพราะ filesystem ไม่ persistent?**
> "ถ้า deploy จริงต้องเปลี่ยนไปใช้ Cloud Storage  
> เช่น AWS S3, Cloudflare R2, หรือ Supabase Storage  
> Logic เหมือนกัน แต่แทนที่ writeFile() จะใช้ SDK ของ cloud แทน"

---

## คำถามยาก (ถ้าถูกถาม)

**Q: N+1 Query Problem คืออะไร มีในโปรเจกต์ไหม?**
> "N+1 คือ Query 1 ครั้ง ได้ list มา N รายการ  
> แล้ว Query อีก N ครั้งเพื่อดึง relation  
> ใน jobs GET เราใช้ include: { creator, assignedEmployees, tasks }  
> Prisma JOIN ให้อัตโนมัติ — จึงเป็น 1 Query"

**Q: Prisma ORM vs Raw SQL ต่างกันยังไง?**
> "ORM เขียน code สะดวกกว่า มี type safety  
> Raw SQL ยืดหยุ่นกว่า เร็วกว่าในบางกรณี  
> project นี้ใช้ Prisma เพื่อความเร็วในการพัฒนาและลด bug ครับ"
