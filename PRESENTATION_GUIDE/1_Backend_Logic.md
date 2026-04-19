x# 🛠 สรุปสถาปัตยกรรม Backend & Database
(สำหรับคนคุมโครงสร้างหลัก)

## 1. ฐานข้อมูล (Database)
*   **เครื่องมือ:** Prisma ORM กับ PostgreSQL
*   **โครงสร้างหลัก:** 
    *   `Job` เชื่อมกับ `User` (ช่าง) และ `InventoryRequest` (พัสดุ)
    *   เราเน้นความโปร่งใส ข้อมูลทุกอย่างมี Audit Log ตามติด
*   **JSON Storage:** เราเก็บลิสต์รายการของเป็น JSON String ใน DB แล้วมา Parse ที่หน้าบ้าน เพื่อความรวดเร็วและยืดหยุ่น

## 2. API (Next.js 15)
*   **หัวใจ:** API Route แบบ Dynamic 
*   **ความล้ำ:** ใช้มาตรฐานใหม่ของ Next.js 15 ที่ทำงานแบบ Asynchronous ทั้งหมด ทำให้ระบบรองรับการเชื่อมต่อจำนวนมากได้ดีขึ้น
*   **Security:** มี Middleware คอยเช็ค Role (Admin/Employee) ก่อนอนุญาตให้เข้าถึง API

## 3. การจัดการสถานะ (Zustand)
*   เราใช้ Zustand แทน Redux เพราะเบากว่าและทำงานร่วมกับ TypeScript ได้ดี
*   มีการใช้ Persistence เพื่อให้ข้อมูลยังอยู่ครบแม้ผู้ใช้เผลอกด Refresh หน้าจอ
