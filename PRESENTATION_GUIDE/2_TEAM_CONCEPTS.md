# 🧠 ทำความเข้าใจ Backend สำหรับทีม
> อ่านไฟล์นี้ก่อน — อธิบายด้วยภาษาง่ายๆ ไม่ต้องมีความรู้ล่วงหน้า

---

## บทที่ 1: API คืออะไร?

### เปรียบเทียบ

> ลองนึกถึงร้านอาหาร 🍜

| ร้านอาหาร           | ระบบเรา |
|----------          |--------|
| ลูกค้า (คุณ)          | Browser / หน้าจอ |
| พนักงานรับออเดอร์     | API Route |
| ครัว | Prisma ORM   |
| วัตถุดิบ/ตู้เย็น         | Database (PostgreSQL) |

**เมื่อลูกค้าสั่งอาหาร:**
1. บอกพนักงาน (เรียก API)
2. พนักงานไปบอกครัว (Prisma query)
3. ครัวดึงวัตถุดิบจากตู้เย็น (DB query)
4. ทำอาหารเสร็จส่งมา (ส่ง response กลับ)

---

## บทที่ 2: HTTP Method คืออะไร?

คิดง่ายๆ ว่าเป็น "คำสั่ง" ที่บอก API ว่าจะทำอะไร

| Method    | ความหมาย   | ตัวอย่างในชีวิตจริง |
|-----------|------------|--------------- |
| `GET`     | ขอดูข้อมูล    | "ขอเมนูหน่อย"    |
| `POST`    | ส่งข้อมูลใหม่  | "ฉันสั่งข้าวผัด"    |
| `PATCH`   | แก้ไขบางส่วน | "เปลี่ยนจากไก่เป็นหมู" |
| `DELETE`  | ลบ         | "ยกเลิกออเดอร์" |

---

## บทที่ 3: Request/Response คืออะไร?

ทุกครั้งที่ Frontend คุยกับ API จะมี:

**Request (สิ่งที่ส่งไป):**
```json
POST /api/jobs
{
  "title": "ซ่อมแอร์ห้อง 302",
  "priority": "high",
  "creatorId": "user-abc123"
}
```

**Response (สิ่งที่ได้กลับมา):**
```json
{
  "id": "job-xyz789",
  "title": "ซ่อมแอร์ห้อง 302",
  "status": "pending",
  "createdAt": "2026-04-20T..."
}
```

---

## บทที่ 4: Database และ Prisma คืออะไร?

### Database = ตารางข้อมูล

```
ตาราง Job:
┌──────────────────────────────────────────┐
│ id      │ title          │ status   │ ... │
├──────────────────────────────────────────┤
│ job-001 │ ซ่อมแอร์ 302  │ pending  │ ... │
│ job-002 │ ซ่อมไฟ 101    │ completed│ ... │
└──────────────────────────────────────────┘
```

### Prisma = แปลง JavaScript เป็น SQL อัตโนมัติ

แทนที่เขียน SQL ยากๆ:
```sql
SELECT * FROM "Job" WHERE status = 'pending' ORDER BY "createdAt" DESC;
```

เราเขียนแบบนี้แทน:
```typescript
prisma.job.findMany({
  where: { status: 'pending' },
  orderBy: { createdAt: 'desc' }
})
```

---

## บทที่ 5: Authentication และ JWT คืออะไร?

### Login Flow

```
1. User กรอก email + password
2. ส่งไป POST /api/auth/signin
3. ตรวจสอบกับ DB (bcrypt เปรียบเทียบ password)
4. ถ้าถูก → สร้าง JWT Token
5. Token เก็บใน Cookie

ทุก Request ต่อไป:
6. Browser แนบ Cookie ไปด้วยอัตโนมัติ
7. API อ่าน Token ออกมา → รู้ว่าใครส่งมา
```

### JWT Token คืออะไร?

> JWT เหมือน **บัตรพนักงาน** ที่เข้ารหัสแล้ว

```
เนื้อหาใน Token (ถอดรหัสออกมา):
{
  "id": "user-123",
  "role": "admin",
  "name": "สมชาย",
  "exp": 1234567890  ← หมดอายุ
}
```

---

## บทที่ 6: Zustand Store คืออะไร?

> Store เหมือน **กระดานไวท์บอร์ด** ของ Frontend

```
DB (ข้อมูลจริง) → fetch ครั้งแรก → Store (กระดาน) → Component อ่านได้ทันที

ถ้า Update:
Component สั่ง → Store อัปเดต UI → ส่ง API ไป DB พร้อมกัน
(Optimistic Update = อัปเดต UI ก่อน รอ DB ทีหลัง → รู้สึกเร็ว)
```

---

## บทที่ 7: Flow ตัวอย่าง — เพิ่มอุปกรณ์ใหม่

```
1. Admin กรอกฟอร์มแล้วกด "บันทึก"
       │
2. handleSave() ใน page.tsx ถูกเรียก
       │
3. addInventory({ name, quantity, ... }) ใน inventoryStore
       │
4. fetch('POST /api/inventory', { body: data })
       │
5. API: ตรวจ session → validate → prisma.inventory.create()
       │
6. DB สร้าง row ใหม่ → ส่ง id + data กลับมา
       │
7. Store อัปเดต inventories array
       │
8. Component re-render → UI แสดงอุปกรณ์ใหม่ทันที
```

---

## บทที่ 8: Status Code ที่ควรรู้

| Code | ความหมาย | เกิดเมื่อไหร่ |
|------|---------|------------|
| `200` | OK | สำเร็จ |
| `201` | Created | สร้างข้อมูลใหม่สำเร็จ |
| `400` | Bad Request | ข้อมูลที่ส่งมาผิดรูปแบบ |
| `401` | Unauthorized | ไม่ได้ Login |
| `403` | Forbidden | Login แล้วแต่ไม่มีสิทธิ์ |
| `404` | Not Found | ไม่พบข้อมูล |
| `500` | Server Error | Bug ใน Code หรือ DB พัง |

---

## สรุปภาพรวม (จำให้ขึ้นใจ)

```
Frontend (สิ่งที่ User เห็น)
  └── Store (cache ข้อมูล + เรียก API)
        └── API Route (ตรวจสิทธิ์ + logic)
              └── Prisma (คุยกับ DB)
                    └── PostgreSQL (เก็บข้อมูลจริง)
```
