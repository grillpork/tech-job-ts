# 🔍 Deep Dive — ทุก API อธิบายทีละ Step

---

## GET /api/inventory — ดึงรายการอุปกรณ์

### Code ที่เกิดขึ้น

```typescript
// src/app/api/inventory/route.ts
export async function GET() {
  // 1. ตรวจว่า Login อยู่ไหม
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. ดึงข้อมูลจาก DB เรียงตามชื่อ
  const items = await prisma.inventory.findMany({
    orderBy: { name: 'asc' }
  });

  // 3. ส่งกลับเป็น JSON
  return NextResponse.json(items);
}
```

### SQL ที่ Prisma Generate ให้

```sql
SELECT * FROM "Inventory" ORDER BY name ASC;
```

### Timeline

```
0ms   → Browser เรียก fetch('/api/inventory')
5ms   → Server รับ request
6ms   → ตรวจ Session (อ่าน Cookie → ถอดรหัส JWT)
8ms   → Prisma ส่ง Query ไป Neon DB (cloud)
~50ms → Neon ส่งข้อมูลกลับ
55ms  → ส่ง JSON response กลับ Browser
60ms  → Store อัปเดต → UI re-render
```

---

## POST /api/jobs — สร้างงานใหม่

### ข้อมูลที่ส่งมา (Request Body)

```json
{
  "title": "ซ่อมเครื่องปรับอากาศห้อง 302",
  "description": "แอร์ไม่เย็น น้ำหยด",
  "priority": "high",
  "creatorId": "user-abc123",
  "assignedEmployeeIds": ["user-def456"],
  "tasks": [
    { "description": "เช็คน้ำยา", "order": 0 },
    { "description": "ทำความสะอาดฟิลเตอร์", "order": 1 }
  ],
  "departments": ["Mechanical"]
}
```

### ขั้นตอนที่เกิดใน API

```
Step 1: Auth Check
  getServerSession() → ตรวจ JWT Token
  ถ้าไม่มี → return 401

Step 2: Role Check
  ถ้า role === 'employee' → return 403 (ห้ามสร้างงาน)

Step 3: Zod Validation
  jobSchema.safeParse(body)
  ถ้า title < 5 ตัวอักษร → return 400 + error detail

Step 4: prisma.job.create()
  - สร้าง job record
  - connect creator (relation)
  - connect assignedEmployees (many-to-many)
  - create tasks (nested)
  - create workLog "Job created" (audit trail)
  - serialize departments, usedInventory → JSON string

Step 5: Response
  parse JSON fields กลับ → ส่ง job object
```

### ทำไม departments ถูกเก็บเป็น JSON string?

```
ปัญหา: SQL ไม่รองรับ Array โดยตรง (ปกติ)
แก้:   เก็บเป็น TEXT แต่ใส่ JSON ข้างใน
       '["Mechanical", "Electrical"]'

ตอนดึงออกมา:
       JSON.parse('["Mechanical", "Electrical"]')
       → ["Mechanical", "Electrical"]
```

---

## PATCH /api/jobs/[id] — อัปเดตงาน

### สิ่งที่ซับซ้อนใน PATCH

```typescript
// กรณี status เปลี่ยนเป็น 'completed'
// ต้องหักสต็อก Inventory ที่ใช้
if (updateData.status === 'completed' && existingJob.status !== 'completed') {
  
  // ✅ ใช้ Transaction — ถ้า update ไหนพัง ทั้งหมด rollback
  await prisma.$transaction(
    itemsToDeduct.map(item =>
      prisma.inventory.update({
        where: { id: item.id },
        data: { quantity: { decrement: item.qty } }
      })
    )
  )
}
```

**ทำไมต้อง Transaction?**

> สมมุติมีอุปกรณ์ 3 รายการที่ต้องหัก  
> ถ้าหัก 2 รายการแล้ว DB error ที่รายการที่ 3  
> โดยไม่มี Transaction → รายการ 1-2 ถูกหักแต่ 3 ไม่ถูก → ข้อมูลพัง  
> มี Transaction → ทั้ง 3 rollback กลับ → ข้อมูล consistent

---

## GET /api/dashboard/stats — สถิติ Dashboard

### วิธีดึงข้อมูลหลายอย่างพร้อมกัน

```typescript
const [
  totalJobs,
  completedJobs,
  pendingJobs,
  openReports,
  lowStockItems,
  allJobs        // ใช้คำนวณ trend
] = await Promise.all([
  prisma.job.count(),
  prisma.job.count({ where: { status: 'completed' }}),
  prisma.job.count({ where: { status: 'pending' }}),
  prisma.report.count({ where: { status: 'open' }}),
  prisma.inventory.count({ where: { quantity: { lte: 10 }}}),
  prisma.job.findMany({ select: { status: true, departments: true, createdAt: true }})
])
```

**ทำไม Promise.all เร็วกว่า?**

```
แบบ Sequential (ช้า):
Query 1 → รอ → Query 2 → รอ → Query 3 → รอ
50ms    + 50ms + 50ms + 50ms + 50ms = 250ms

แบบ Promise.all (เร็ว):
Query 1 ─┐
Query 2 ─┼ ยิงพร้อมกัน
Query 3 ─┘
= 50ms (รอแค่อันที่ช้าที่สุด)
```

---

## Authentication Flow — อธิบายทีละขั้น

```
1. User เปิด /login
   └── หน้า Login form แสดงขึ้น

2. User กรอก email + password แล้วกด Login
   └── signIn("credentials", { email, password })

3. NextAuth ส่งไป authorize() ใน auth.ts
   └── prisma.user.findUnique({ where: { email } })
   └── bcrypt.compare(password, user.password)

4. ถ้าถูกต้อง → return user object
   └── NextAuth สร้าง JWT Token: { id, role, name }
   └── เก็บใน HttpOnly Cookie (JS อ่านไม่ได้ = ปลอดภัยกว่า)

5. Browser redirect ไป Dashboard
   └── Middleware เช็ค Token → รู้ว่าเป็น role อะไร
   └── admin → /dashboard/admin
   └── employee → /dashboard/employee

6. ทุก API Request
   └── Browser แนบ Cookie อัตโนมัติ
   └── getServerSession(authOptions) ถอดรหัส Token
   └── รู้ว่าใครส่ง request มา
```

---

## Zustand Store — วงจรชีวิตข้อมูล

```
App โหลด → DashboardLayout mount
    │
    └── DataInitializer mount
            │
            ├── fetchJobs()    → GET /api/jobs    → set({ jobs })
            ├── fetchInventory() → GET /api/inventory → set({ inventories })
            ├── fetchReports() → GET /api/reports → set({ reports })
            ├── fetchUsers()   → GET /api/users   → set({ users })
            └── fetchAuditLogs() → GET /api/audit-logs → set({ auditLogs })

ทุก Component เรียกใช้แบบนี้:
const { jobs } = useJobStore()
→ ไม่ต้อง fetch เอง — ดึงจาก Store ที่โหลดแล้ว

เมื่อ addInventory():
→ POST /api/inventory → รอ response → set inventory ใน Store
→ Component ที่ใช้ useInventoryStore() จะ re-render อัตโนมัติ
```
