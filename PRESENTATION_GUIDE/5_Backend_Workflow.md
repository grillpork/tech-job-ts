# ⚙️ กระบวนการทำงานหลังบ้าน (Backend Workflow)
เอกสารชุดนี้อธิบายตรรกะการทำงาน (Logic) ของระบบในแต่ละส่วน สำหรับการพรีเซนต์เชิงเทคนิค

---

## 1. กระบวนการ Login (Authentication Flow)
เมื่อผู้ใช้กรอก Username/Password ระบบหลังบ้านจะทำงานตามลำดับดังนี้:
1.  **Request Reception:** รับข้อมูล Credentials ผ่าน `POST /api/auth`
2.  **Credential Validation:** 
    *   ดึงข้อมูลผู้ใช้จาก Database ผ่าน `email` ที่ระบุ
    *   ใช้ **Bcrypt** เปรียบเทียบรหัสผ่าน (ที่ได้รับ vs ที่แฮชไว้ใน DB)
3.  **Session & JWT Generation:** 
    *   ถ้าผ่าน ระบบจะสร้าง **JSON Web Token (JWT)**
    *   เก็บลายนิ้วมือของผู้ใช้ (ID, Name, Role) ไว้ใน Token
4.  **Response:** ส่ง HTTP Status 200 พร้อมกับ Set-Cookie (Session Token) กลับไปที่ Browser

---

## 2. กระบวนการสร้างใบงาน (Job Creation Flow)
1.  **Auth Check:** ตรวจสอบก่อนว่าผู้ทำรายการมี Role เป็น Admin หรือ Manager หรือไม่
2.  **Data Validation:** ตรวจสอบฟิลด์บังคับ (Title, Description, Technician ID)
3.  **Database Transaction:** 
    *   บันทึกข้อมูลลงตาราง `Job`
    *   เชื่อมโยง Relation กับตาราง `User` (ช่างที่รับผิดชอบ)
4.  **Audit Logging:** ระบบจะเขียน Log ลงตาราง `AuditLog` ทันทีว่า "Job ID นี้ถูกสร้างโดยใคร"

---

## 3. กระบวนการเบิกพัสดุ (Inventory Request Flow)
หลังบ้านมีการตรวจสอบที่รัดกุม 3 ชั้น:
1.  **Existence Check:** ตรวจสอบว่าพัสดุ ID นั้นมีอยู่จริงในคลังหรือไม่
2.  **Stock Availability Check:** ตรวจสอบว่า `quantity` (จำนวนในคลัง) >= `requestedQty` (จำนวนที่ขอเบิก) หรือไม่
3.  **State Management:** 
    *   สร้าง Request ในตาราง `InventoryRequest` พร้อมสถานะ `pending`
    *   **ยังไม่ตัดสต็อกจริง** จนกว่า Admin จะเปลี่ยนสถานะเป็น `approved` ผ่าน API

---

## 4. กระบวนการปิดงาน (Job Completion Flow)
ส่วนที่มีความซับซ้อนของข้อมูลมากที่สุด:
1.  **Signature Processing:** 
    *   รับข้อมูลภาพลายเซ็นในรูปแบบ **Base64 String** 
    *   นำไปบันทึกลงในฟิลด์ `signature` ของตาราง `CompletionRequest`
2.  **Image Array Handling:** 
    *   จัดการรายการรูปภาพก่อน/หลังงาน โดยเก็บเป็น JSON Array ใน Database
3.  **Inventory Sync:** 
    *   เมื่อสถานะเปลี่ยนเป็น `completed` ระบบจะตรวจสอบพัสดุที่ใช้ไป และทำการตัดสต็อก (Stock Deduction) จริงในตาราง `Inventory`
4.  **Status Propagation:** อัปเดตสถานะที่ตาราง `Job` หลักเป็น `completed`

---

## 5. ระบบตรวจสอบ (Audit Log System)
ทุก API ที่มีการ "เปลี่ยนแปลงข้อมูล" (POST, PUT, DELETE) จะมีระบบ Middleware เสริม:
*   **Capture Input:** ดักจับค่าเดิม (Old Value) และค่าใหม่ (New Value)
*   **Asynchronous Logging:** เขียนประวัติการแก้ไขลง Database แบบแยกส่วน เพื่อไม่ให้กระทบความเร็วของระบบหลัก
*   **Traceability:** สามารถสืบค้นย้อนกลับได้ว่า ข้อมูลผิดพลาดเกิดขึ้นที่วินาทีไหนและเกิดจาก User ใด

---

### 💡 มุมมองที่ควรพูดตอนพรีเซนต์:
"ระบบหลังบ้านของเราไม่ได้แค่บันทึกข้อมูลครับ แต่เราให้ความสำคัญกับ **Data Integrity** (ความถูกต้องของข้อมูล) และ **Security** (ความปลอดภัย) เป็นหลัก โดยมีการตรวจสอบเงื่อนไข (Business Logic) ตลอดทุกขั้นตอนครับ"
