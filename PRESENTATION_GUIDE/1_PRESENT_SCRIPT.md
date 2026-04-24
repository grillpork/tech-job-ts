# 🎯 แผนการพรีเซนต์ Backend — Tech Job System
> **เทอม 2** | ทีม 4 คน | ใช้เวลาประมาณ 15-20 นาที

---

## 📌 หัวใจสำคัญ: "พูดถึง Frontend แต่อธิบายด้วย Backend"

เทอมที่แล้วพูดว่า **"หน้านี้แสดงข้อมูลอะไร"**  
เทอมนี้ต้องพูดว่า **"ข้อมูลนี้มาจากไหน ผ่านอะไร และบันทึกอย่างไร"**

```
User กดปุ่ม → Store เรียก API → API ดึง/บันทึก DB → ส่งกลับมา → UI อัปเดต
```

---

## 👥 การแบ่งส่วนพรีเซนต์ (4 คน)

| คน | ส่วนที่พูด | หัวข้อหลัก |
|----|-----------|------------|
| **คนที่ 1** (ตัวเอง) | Overview + Auth | System Architecture, Login Flow, JWT Token, Role-Based Access |
| **คนที่ 2** | Jobs API | POST/GET/PATCH /api/jobs, Zod Validation, Prisma Query |
| **คนที่ 3** | Inventory API | GET/POST/PATCH/DELETE /api/inventory, Upload System |
| **คนที่ 4** | Reports + Audit + Stats | /api/reports, /api/audit-logs, Dashboard Stats, Promise.all |

---

## 🔴 คนที่ 1 — System Overview + Authentication (5 นาที)

### Script เปิดตัว

> "เทอมที่แล้วเราแสดงให้เห็นว่าระบบ **ทำอะไร**  
> เทอมนี้เราจะแสดงว่าระบบ **ทำงานยังไง**  
> ตั้งแต่ที่ User กดปุ่ม ไปจนถึงข้อมูลที่บันทึกใน Cloud Database  
> ในเวลา... ไม่กี่ร้อย Millisecond"

### อธิบาย Architecture

วาดหรือชี้ diagram นี้:

```
Browser (Next.js)
    │
    ├── /app/dashboard/*        ← หน้าต่างๆ (React)
    │       │
    │       └── zustand store   ← จัดการ State (เหมือน RAM)
    │               │
    │               └── fetch('/api/...')
    │
    ├── /app/api/*              ← API Routes (Backend)
    │       │
    │       └── Prisma ORM      ← แปลง JS → SQL Query
    │
    └── Neon PostgreSQL         ← ฐานข้อมูลบน Cloud
```

> "ทุกอย่างอยู่ใน Next.js โปรเจกต์เดียว  
> แต่ /app/api ทำงานฝั่ง Server — User ไม่มีทางเห็น Code นี้"

### อธิบาย Auth

**เปิดไฟล์:** `src/lib/auth.ts`

> "Authentication ใช้ NextAuth + JWT  
> เมื่อ Login สำเร็จ ระบบสร้าง Token ที่มี role ฝังอยู่ข้างใน  
> ทุก API Route จะตรวจ Token ก่อนทำงาน  
> ถ้าไม่มี Token → 401 Unauthorized ทันที"

**เปิดไฟล์:** `src/middleware.ts`

> "Middleware คือ Gate Keeper  
> ก่อนถึงหน้าไหนก็ตาม ระบบเช็คก่อนว่า Login ไหม  
> Role เป็น admin → เข้า /dashboard/admin ได้  
> Role เป็น employee → redirect ออกอัตโนมัติ"

---

## 🟡 คนที่ 2 — Jobs API (4 นาที)

### Script

**แสดง:** หน้า `/dashboard/admin/jobs` แล้วกดสร้างงาน

> "ตอนกดสร้างงาน — ไม่ใช่แค่เก็บใน Memory แล้ว  
> ข้อมูลจะวิ่งไป 3 ขั้นตอนคือ Validate → Save DB → Update UI"

**เปิดไฟล์:** `src/app/api/jobs/route.ts`

อธิบาย Flow ทีละบรรทัด:
```
1. POST /api/jobs รับ request เข้ามา
2. getServerSession() → ตรวจว่า Login อยู่ไหม
3. jobSchema.safeParse(body) → ตรวจรูปแบบข้อมูล
4. prisma.job.create() → บันทึกลง PostgreSQL
5. return NextResponse.json(result) → ส่งกลับ
```

**พูดเรื่อง Zod:**

> "ทำไมต้อง Validate?  
> เพราะ API เป็น Public endpoint — ใครก็เรียกได้  
> ถ้าส่งข้อมูลผิด เช่น title แค่ 2 ตัวอักษร  
> Zod จะ reject ก่อนที่จะไปแตะ Database เลย"

**เปิด:** `src/stores/features/jobStore.ts` ส่วน `fetchJobs`

> "Store เป็น Cache ของ Frontend  
> Fetch ครั้งแรกจาก API → เก็บไว้ใน Store  
> Component ทุกหน้าดึงจาก Store โดยตรง  
> ไม่ต้อง Fetch ซ้ำทุกครั้ง → เร็วขึ้น"

---

## 🟢 คนที่ 3 — Inventory API + Upload (4 นาที)

### Script

**แสดง:** หน้า `/dashboard/admin/inventorys`

> "Inventory เป็นระบบจัดการอุปกรณ์  
> ทุก action ที่เห็นบนหน้าจอ — ส่งไป API และบันทึกลง DB ทั้งหมด"

**อธิบาย RESTful Pattern:**

> "API ออกแบบตาม REST Standard  
> ใช้ HTTP Method บอกว่าจะทำอะไร"

```
GET    /api/inventory        ← ขอดูข้อมูล (อ่าน)
POST   /api/inventory        ← ส่งข้อมูลใหม่ (สร้าง)
PATCH  /api/inventory/:id    ← ส่งข้อมูลที่เปลี่ยน (แก้ไข)
DELETE /api/inventory/:id    ← ลบ
```

**เปิดไฟล์:** `src/app/api/inventory/route.ts`

> "ทุก endpoint มี 2 บรรทัดนี้เสมอ"

```typescript
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

> "ถ้าไม่ได้ Login จะได้ 401 กลับมา  
> ป้องกันคนภายนอกเรียก API โดยตรง"

**อธิบาย Upload:**

> "รูปภาพไม่ได้เก็บใน Database โดยตรง  
> แต่เก็บเป็น Path บน Server แบบ Structured:  
> `/uploads/inventory/[id]/filename.jpg`  
> แล้วบันทึกแค่ URL ลงใน Database"

---

## 🔵 คนที่ 4 — Reports + Audit + Dashboard Stats (4 นาที)

### Script

**แสดง:** Dashboard `/dashboard/admin/dashboard`

> "ตัวเลขบน Dashboard ไม่ได้นับจาก Store  
> แต่ API รวมจาก Database จริง แบบ Real-time"

**เปิดไฟล์:** `src/app/api/dashboard/stats/route.ts`

```typescript
const [totalJobs, completedJobs, openReports] = await Promise.all([
  prisma.job.count(),
  prisma.job.count({ where: { status: 'completed' }}),
  prisma.report.count({ where: { status: 'open' }})
])
```

> "`Promise.all` คือการยิง Query หลายอัน **พร้อมกัน**  
> แทนที่จะรอทีละ Query (3 วิ) → ทำพร้อมกัน (1 วิ)  
> เป็นเทคนิค Optimization ที่สำคัญมาก"

**แสดง:** หน้า Reports

> "Reports ถูก Sync กับ DB ผ่าน API  
> เปลี่ยน Status ใน Dialog → PUT /api/reports/:id → DB อัปเดตทันที"

**อธิบาย Audit Log:**

> "ทุก action สำคัญในระบบมีการบันทึก Audit Log  
> ว่า ใคร ทำอะไร กับอะไร เมื่อไหร่  
> เป็น Traceability — ถ้ามีปัญหา ย้อนดูได้ว่าใครทำ"

---

## 💡 เทคนิคการพูดสำหรับทุกคน

1. **เริ่มจากหน้าจอก่อน** → แล้วค่อยโชว์ Code
2. **ใช้ประโยค "เบื้องหลัง..."** หรือ "ข้างหลังปุ่มนี้คือ..."
3. **ไม่ต้องอ่าน Code ทุกบรรทัด** — ชี้แค่ส่วนสำคัญ
4. **ถ้าถูกถาม** ดูไฟล์ `3_QA_ANSWERS.md`
