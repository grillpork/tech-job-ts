# 📋 สรุป Backend Workflow — ฉบับดูด่วน
> ใช้ review ก่อน Present หรือ ทบทวนวันก่อน

---

## 🗺️ แผนที่โปรเจกต์

```
src/
├── app/
│   ├── api/                    ← 🔴 Backend ทั้งหมดอยู่ที่นี่
│   │   ├── auth/[...nextauth]/ ← Login/Logout
│   │   ├── jobs/               ← CRUD งาน
│   │   ├── inventory/          ← CRUD อุปกรณ์
│   │   ├── reports/            ← CRUD รายงาน
│   │   ├── users/              ← CRUD ผู้ใช้
│   │   ├── audit-logs/         ← บันทึก action
│   │   ├── dashboard/stats/    ← สถิติ
│   │   └── upload/             ← อัปโหลดรูป
│   │
│   └── dashboard/              ← 🟢 Frontend ทั้งหมดอยู่ที่นี่
│       ├── (admin)/admin/
│       └── (employee)/employee/
│
├── stores/                     ← 🔵 State Management
│   ├── features/jobStore.ts
│   ├── features/inventoryStore.ts
│   ├── features/reportStore.ts
│   ├── features/userStore.ts
│   └── features/auditLogStore.ts
│
└── lib/
    ├── auth.ts                 ← NextAuth config
    ├── prisma.ts               ← DB connection
    └── api-utils.ts            ← Helper functions
```

---

## 🔄 Request Flow ทุก API

```
1. Store เรียก fetch(URL, options)
2. Middleware ตรวจ route ว่าต้อง login ไหม
3. API Route: getServerSession() → ตรวจ JWT
4. API Route: Validate input (Zod)
5. Prisma: query DB
6. API Route: return NextResponse.json()
7. Store: อัปเดต state
8. Component: re-render
```

---

## 📊 Database Schema สรุป

| Table | Fields หลัก | Relations |
|-------|-----------|----------|
| User | id, name, email, role, password | → Job (creator/assigned), Report |
| Job | id, title, status, priority | → User, Task, WorkLog, Report |
| Task | id, description, isCompleted | → Job |
| Inventory | id, name, quantity, status, imageUrl | - |
| Report | id, title, status, priority | → User (reporter/assignee), Job |
| AuditLog | id, action, entityType, performedById | - |
| WorkLog | id, status, note | → Job, User |

---

## 🔑 Key Concepts จำให้ได้

| Concept | ย่อๆ ว่าอะไร |
|---------|------------|
| REST API | มาตรฐานการออกแบบ API ด้วย HTTP Method |
| JWT | Token ที่เข้ารหัส ใช้พิสูจน์ตัวตน |
| Prisma | ORM แปลง TypeScript → SQL |
| Zustand | State manager ของ Frontend |
| bcrypt | วิธีเข้ารหัส password อย่างปลอดภัย |
| Transaction | ทำหลายอย่างพร้อมกัน ถ้าพังหนึ่งอัน rollback ทั้งหมด |
| Middleware | ตรวจสอบก่อนถึง route จริง |
| RBAC | Role-Based Access Control — สิทธิ์ตาม role |
| Dynamic RBAC | ระบบสิทธิ์ที่เพิ่มความละเอียด เช่น lead_[Department] เพื่อแยกแผนกอิสระ |

---

## ⚡ Checklist ก่อน Present

- [ ] เปิด Dev Server ไว้แล้ว (`npm run dev`)
- [ ] Login ด้วย account admin ไว้แล้ว
- [ ] เปิดหน้า Dashboard ไว้แล้ว
- [ ] เปิด VS Code ที่ไฟล์ที่จะโชว์แต่ละส่วน
- [ ] ซ้อมพูด flow อย่างน้อย 1 รอบ
- [ ] อ่าน Q&A จากไฟล์ `3_QA_ANSWERS.md`

---

## 📝 Script สั้นๆ สำหรับทุกส่วน

### เวลาโชว์หน้าจอแล้วจะอธิบาย Backend ให้พูดแบบนี้:

> "ที่เห็นบนหน้าจอคือ [อธิบาย UI]  
> แต่เบื้องหลัง เมื่อกด [ปุ่ม]  
> จะเกิดการเรียก API [METHOD /api/path]  
> ซึ่งไปดึง/บันทึกข้อมูลจาก Database  
> แล้วส่งกลับมาอัปเดต UI นี้"

### Template ตอบคำถาม:

> "เหตุผลที่เลือกใช้ [X] เพราะ [Y]  
> ซึ่งแก้ปัญหา [Z]"
