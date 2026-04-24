# Report Module: Workflow & Database Architecture

ระบบ **Report (รายงานปัญหา/รับเรื่องร้องเรียน)** เป็นระบบที่จดบันทึกปัญหา การแจ้งเครื่องมือชำรุด หรือแม้แต่การขอฟีเจอร์เพิ่มเติม ภายในระบบสามารถเชื่อมโยงไปยัง Job (ใบงานซ่อม) หรือ Inventory (อุปกรณ์) ได้เพื่อการติดตามต่อได้อย่างราบรื่น

---

## 🔄 Workflow การทำงานของ Report Module

1. **การแจ้งเรื่อง (Creation)**
   * พนักงาน (Employee) หรือ ผู้ใช้งาน สามารถเปิด Report ใหม่ขึ้นมาได้
   * ระบุชื่อเรื่อง (Title), คำอธิบาย (Description), สิ่งที่แนบมา (Attachments), และประเภท (Type) ของ Report เช่น `bug`, `request`, `incident`, หรือ `improvement`
   * ทันทีที่สร้างเสร็จ ระบบจะลงบันทึกเวลา และระบุสถานะเป็น **`open` (เปิดเรื่อง)**

2. **การติตตามและการมอบหมาย (Assignment & Triage)**
   * Admin หรือ Manager เข้ามาดูหน้าประเมินรายการ
   * กำหนดทิศทางของคำขอ เช่น ระบุความสำคัญ (Priority) และกำหนด **ผู้รับผิดชอบ (Assignee)**
   * สามารถทำการอัปเดตสถานะเป็น **`in_progress` (กำลังดำเนินการ)** เมื่อเจ้าหน้าที่เริ่มทำงานแก้ไขเรื่องนั้นๆ

3. **การเชื่อมโยงข้อมูล (Data Linkage) - *ถ้ามี***
   * หากเรื่องที่แจ้งเกี่ยวข้องกับใบงานซ่อมที่เปิดอยู่ สามารถเชื่อมโยง Report เข้ากับ **`Job`** เพื่อส่งต่อข้อมูลให้ทีมช่างพิจารณาร่วมได้
   * หากเรื่องที่แจ้งมาจากเครื่องมือที่พังหรือเสียหาย สามารถผูกผูกกับ **`Inventory`** เพื่อแจ้งฝั่งบัญชีหรือทีมจัดซื้ออุปกรณ์ได้

4. **การแก้ไขและการปิดเรื่อง (Resolution & Closure)**
   * ผู้รับผิดชอบ ทำการแก้ไขปัญหาเรียบร้อย จะเปลี่ยนสถานะเป็น **`resolved` (แก้ไขปัญหาเบื้องต้นแล้ว)**
   * เมื่อผู้แจ้งรับทราบ หรือ Admin ทำการตรวจสอบว่าเรียบร้อยสมบูรณ์ จะทำการปิดเรื่องและให้สถานะเป็น **`closed` (ปิดเคส)**

---

## 💾 โครงสร้าง Database (Prisma Schema: Report)

ฐานข้อมูลของ `Report` ถูกออกแบบโครงสร้างดังนี้เพื่อให้ครอบคลุมการทำงานทุกรูปแบบ:

```prisma
model Report {
  id          String   @id @default(uuid()) // รหัส Report เข้ารหัสแบบ UUID
  title       String                        // หัวเรื่องการแจ้งปัญหา
  description String?                       // คำอธิบายเพิ่มเติม
  type        String                        // ประเภท(หมวดหมู่): "bug", "request", "incident", "improvement"
  status      String   @default("open")     // สถานะ: "open", "in_progress", "resolved", "closed"
  priority    String?                       // ระดับความสำคัญ: "low", "medium", "high", "urgent"
  
  createdAt   DateTime @default(now())      // วันเวลาที่สร้าง Report
  updatedAt   DateTime? @updatedAt          // วันเวลาที่มีการแก้ไขล่าสุด
  
  // -- Relations (ความสัมพันธ์กับตารางอื่นๆ) --
  
  reporterId  String                        // รหัสผู้สร้าง Report (คนแจ้ง)
  reporter    User     @relation("ReportReporter", fields: [reporterId], references: [id])
  
  assigneeId  String?                       // รหัสผู้รับผิดชอบที่ตามไปแก้ไข
  assignee    User?    @relation("ReportAssignee", fields: [assigneeId], references: [id])
  
  relatedJobId       String?                // ไอดีใบงาน (ผูกกับ Job ถ้ารายงานปัญหานี้เกี่ยวกับการปฏิบัติงานนั้น ๆ)
  relatedJob         Job?    @relation(fields: [relatedJobId], references: [id])
  
  relatedInventoryId String?                // ไอดีอุปกรณ์ (ผูกกับ Inventory ถ้าพังหรือชำรุด)
  
  // -- ข้อมูลเสริม --
  attachments String?                       // เก็บข้อมูล JSON Array ของ URL ไฟล์แนบ หรือ รูปหลักฐาน
  tags        String?                       // แฮชแท็กหรือป้ายกำกับ (JSON Array) สำหรับค้นหาหรือแยกประเภทตามต้องการ
}
```

### 💡 อธิบาย Field สำคัญ (พูดให้เพื่อนฟังแบบเข้าใจง่าย)
* **`type` (ประเภทปัญญา):** มีไว้แยกประเภทกระดานว่าอันนี้คือ Bug (ข้อผิดพลาดระบบ), Request (ขอเบิก/ขอฟีเจอร์), Incident (เหตุขัดข้องหน้างาน) หรือ Improvement (เสนอแนะ) 
* **`status` (สถานะงาน):** เป็นหัวใจหลักของ Lifecycle โดยปกติมันจะมีอายุของมัน เริ่มที่ Open ➔ In Progress ➔ Resolve ➔ จนสุดท้ายคือ Closed.
* **`reporter` กับ `assignee`:** เพื่อให้รู้ว่า "ใครเป็นคนบ่น" (Reporter) และ "ใครเป็นคนตามไปเช็ด" (Assignee)
* **`relatedJobId` และ `relatedInventoryId`:** เป็นสะพานเชื่อมไปยังโมดูลอื่น (ถ้าปัญหาแอร์ในห้องประชุมพัง เราก็สามารถผูกรายงานนี้กับ Inventory รหัสแอร์ตัวนั้นได้โดยตรง)
