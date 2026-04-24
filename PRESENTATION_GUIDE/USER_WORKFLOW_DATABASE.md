# User Module: Workflow & Database Architecture

ระบบ **User (ผู้ใช้งานและสิทธิ์การเข้าถึง)** เป็นแกนหลักของการจัดการ Auth (การล็อกอิน) และการกำหนดโครงสร้างหน้าที่ของแต่ละคนในองค์กร (Role-based Access Control - RBAC)

---

## 🔄 Workflow การทำงานของ User Module

1. **การลงทะเบียนและจัดเก็บ (Registration & Authentication)**
   * ระบบใช้ **NextAuth.js** ร่วมกับ `bcrypt` เพื่อตรวจสอบรหัสผ่าน (Password Hashing) เพิ่มความปลอดภัยสูงสุด
   * ข้อมูลส่วนตัว เช่น อีเมล, ทักษะ (Skills), ตำแหน่ง (Role) จะถูกจัดเก็บตั้งแต่การเพิ่มรายชื่อผู้ใช้เข้าระบบ

2. **ระบบสิทธิ์ผู้ใช้งาน (Role-Based Access Control)**
   ผู้ใช้จะมีระดับสิทธิ์ (`role`) จัดแบ่งตามสายงาน เพื่อจำกัดสิทธิ์หน้าที่จะเห็น:
   * **`admin`**: ผู้ดูแลระบบ สามารถจัดการ ข้อมูล User, Job, Report, Inventory ได้ทั้งหมด
   * **`manager`**: ผู้จัดการ เข้าถึงหน้าสรุปภาพรวม (Dashboard) และจัดการทรัพยากรส่วนใหญ่ได้เทียบเท่า admin
   * **`lead_technician`**: หัวหน้าช่าง สามารถรับผิดชอบอนุมัติงาน แก้ไขปัญหา และเป็นผู้ให้ผ่าน "คำขอจบงาน" 
   * **`employee`**: พนักงานทั่วไป/ช่างเทคนิค มีหน้า Dashboard ของตนเองเพื่อดูงานที่ได้รับมอบหมาย และส่งรายงานปัญหาได้

3. **การเชื่อมโยงระบบงาน (Ecosystem Integration)**
   * **Job (งาน):** ผู้ใช้สามารถเป็นได้ทั้งคนสั่งงาน (`creator`), หัวหน้างาน (`leadTechnician`), และผู้ลงมือทำ (`assignedEmployees`)
   * **Report (การรายงาน):** เป็นได้ทั้งผู้แจ้งเหตุ (`reporter`) และคนรับผิดชอบไปแก้ไข (`assignee`)
   * **WorkLog (ประวัติ):** ทุกการกระทำ หรือการเปลี่ยนสถานะาน (Status) จะถูกลงชื่ออัตโนมัติว่า "ใคร" เป็นคนเปลี่ยน

---

## 💾 โครงสร้าง Database (Prisma Schema: User)

```prisma
model User {
  id                  String    @id @default(uuid())
  name                String                        // ชื่อ - นามสกุล
  email               String?   @unique             // อีเมลสำหรับล็อกอิน
  password            String?                       // รหัสผ่าน (ผ่านการ Hash ด้วย bcrypt)
  
  role                String    @default("employee") // ระดับสิทธิ์: "admin", "manager", "lead_technician", "employee"
  department          String?                       // แผนกของพนักงาน
  status              String?   @default("active")  // สถานะบัญชี เช่น active, inactive
  
  // -- ข้อมูลพื้นฐานทั่วไป (Profile Data) --
  imageUrl            String?                       // รูปโปรไฟล์
  phone               String?
  bio                 String?
  skills              String?                       // ทักษะของช่าง (สำหรับจับคู่งาน) เก็บเป็น JSON Array หรือ Text
  address             String?
  employeeId          String?                       // รหัสพนักงาน
  employmentType      String?                       // ประเภทการจ้าง เช่น Full-time, Part-time
  joinedAt            DateTime? @default(now())
  
  // -- ข้อมูลโซเชียลและการติดต่อเสริม --
  linkedin            String?
  github              String?
  facebook            String?
  lineId              String?
  
  // -- Relations (ความสัมพันธ์กับฐานข้อมูลตารางอื่นๆ) --
  // เกี่ยวกับงาน (Job)
  createdJobs         Job[]     @relation("JobCreator")
  leadJobs            Job[]     @relation("JobLead")
  assignedJobs        Job[]     @relation("JobAssigned")
  
  // เกี่ยวกับการแจ้งปัญหา (Report)
  reportedIssues      Report[]  @relation("ReportReporter")
  assignedIssues      Report[]  @relation("ReportAssignee")
  
  // ประวัติการทำงาน (Audit & Logging)
  updatedWorkLogs     WorkLog[]                     // ประวัติกดอัปเดตงาน (เพื่อให้รู้ว่าใครกดเปลี่ยนสถานะอะไร)
}
```

### 💡 อธิบาย Field สำคัญ (พูดให้เพื่อนฟังแบบเข้าใจง่าย)
* **`role`:** คือเส้นเลือดใหญ่ที่แอปพลิเคชันจะใช้เช็คว่า ยูสเซอร์คนนี้เข้าหน้าไหนได้บ้าง และมีปุ่มกดอนุมัติหรือไม่ (Admin สั่งได้ทุกอย่าง, Employee กดได้แค่งานของตัวเอง)
* **`skills`:** เก็บเป็นรูปแบบข้อความหรือ JSON เพื่อนำมาวิเคราะห์เวลา Assign หน้าที่ ว่าช่างคนไหนถนัดเรื่องอะไร (เช่น แอร์, ไฟฟ้า)
* **`Relations ใหญ่ 3 เส้น`:** จะเห็นได้ชัดว่า User หนึ่งคน จะไปเกาะกับทั้ง Job (งานสร้าง, งานคุม, งานทำ) และ Report (คนบ่น, คนแก้) รวมไปถึง WorkLog (ประวัติการกดทุกอย่างในระบบ)
