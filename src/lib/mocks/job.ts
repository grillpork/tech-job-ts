import { Job, Attachment } from "../types/job";
import { MOCK_USERS } from "./user";

export const MOCK_JOBS: Job[] = [
  // {
  //   id: "job-001",
  //   title: "ซ่อมเครื่องปรับอากาศ ชั้น 5",
  //   description: "แอร์ห้องประชุมใหญ่ไม่เย็น มีน้ำหยด ต้องตรวจสอบและซ่อมแซม",
  //   status: "in_progress",
  //   departments: ["Mechanical"],
  //   type: "คอนโด",
  //   priority: "high",
  //   creator: {
  //     id: "user-manager-1",
  //     name: "วิภา หัวหน้าทีม",
  //     role: "manager",
  //   },
  //   assignedEmployees: [MOCK_USERS[11], MOCK_USERS[12]],
  //   leadTechnician: MOCK_USERS[3],
  //   tasks: [
  //     {
  //       id: "task-1",
  //       description: "ตรวจสอบระบบน้ำยาแอร์",
  //       details: null,
  //       isCompleted: false,
  //       order: 0,
  //     },
  //     {
  //       id: "task-2",
  //       description: "ล้างแผ่นกรอง",
  //       details: "ใช้น้ำแรงดันสูงฉีดล้าง",
  //       isCompleted: false,
  //       order: 1,
  //     },
  //   ],
  //   createdAt: "2025-11-20T09:00:00.000Z",
  //   startDate: "2025-11-21",
  //   endDate: "2025-11-22",
  //   location: { lat: 13.7563, lng: 100.5018, name: "อาคารสำนักงานใหญ่" },
  //   locationImages: [
  //     "https://pix10.agoda.net/hotelImages/124/1246280/1246280_16061017110043391702.jpg?ca=6&ce=1&s=414x232",
  //   ],
  //   attachments: [],
  //   beforeImages: [],
  //   afterImages: [],
  //   usedInventory: [
  //     { id: "inv-001", qty: 2 },
  //     { id: "inv-002", qty: 1 },
  //   ],
  //   customerName: "คุณสมชาย ใจดี",
  //   customerPhone: "+66 81 234 5678",
  //   signature: null,
  //   rejectionReason: null,
  //   workLogs: [
  //     {
  //       id: "log-001",
  //       date: "2025-11-20T09:00:00.000Z",
  //       updatedBy: {
  //         id: "user-manager-1",
  //         name: "วิภา หัวหน้าทีม",
  //       },
  //       status: "pending",
  //       note: "งานถูกสร้างขึ้น",
  //       createdAt: "2025-11-20T09:00:00.000Z",
  //     },
  //   ],
  // },
  // {
  //   id: "job-002",
  //   title: "ติดตั้งโปรแกรม Antivirus ใหม่",
  //   description:
  //     "ติดตั้งโปรแกรม Antivirus เวอร์ชันล่าสุดให้กับคอมพิวเตอร์ทั้งหมดในแผนก IT",
  //   status: "in_progress",
  //   departments: ["Technical"],
  //   type: "บ้าน",
  //   priority: "medium",
  //   creator: {
  //     id: "user-manager-1",
  //     name: "วิภา หัวหน้าทีม",
  //     role: "manager",
  //   },
  //   assignedEmployees: [
  //     MOCK_USERS[17], // user-emp-5 (นาย จ. ช่างเทคนิค)
  //   ],
  //   leadTechnician: MOCK_USERS[3], // user-lead-4 (สมชาย ช่างเทคนิค)
  //   tasks: [
  //     {
  //       id: "task-3",
  //       description: "ดาวน์โหลดโปรแกรม Antivirus",
  //       details: "ดาวน์โหลดจากเว็บไซต์อย่างเป็นทางการ",
  //       isCompleted: true,
  //       order: 0,
  //     },
  //     {
  //       id: "task-4",
  //       description: "ติดตั้งโปรแกรมบนคอมพิวเตอร์",
  //       details: "ติดตั้งบนคอมพิวเตอร์ทั้งหมด 20 เครื่อง",
  //       isCompleted: false,
  //       order: 1,
  //     },
  //   ],
  //   createdAt: "2025-11-24T14:30:00.000Z",
  //   startDate: "2025-11-24",
  //   endDate: "2025-11-25",
  //   location: { lat: 13.7563, lng: 107.5018, name: "แผนก IT" },
  //   locationImages: [
  //     "https://pix10.agoda.net/hotelImages/124/1246280/1246280_16061017110043391702.jpg?ca=6&ce=1&s=414x232",
  //   ],
  //   attachments: [],
  //   beforeImages: [],
  //   afterImages: [],
  //   usedInventory: [],
  //   customerName: null,
  //   customerPhone: null,
  //   signature: null,
  //   rejectionReason: null,
  //   workLogs: [
  //     {
  //       id: "log-002",
  //       date: "2025-11-24T14:30:00.000Z",
  //       updatedBy: {
  //         id: "user-admin-1",
  //         name: "สมชาย จัดการเก่ง",
  //       },
  //       status: "in_progress",
  //       note: "งานถูกสร้างขึ้นและสถานะเป็น 'กำลังดำเนินการ' อัตโนมัติ เนื่องจากมีการมอบหมาย Lead Technician และ Employees ครบถ้วนแล้ว",
  //       createdAt: "2025-11-24T14:30:00.000Z",
  //     },
  //   ],
  // },
  // {
  //   id: "job-003",
  //   title: "ตรวจสอบระบบไฟส่องสว่าง ลานจอดรถ",
  //   description: "ไฟส่องสว่างลานจอดรถชั้น B1 ดับหลายจุด",
  //   status: "pending_approval",
  //   departments: ["Electrical"],
  //   type: "คอนโด",
  //   priority: "low",
  //   creator: {
  //     id: "user-manager-1",
  //     name: "วิภา หัวหน้าทีม",
  //     role: "manager",
  //   },
  //   assignedEmployees: [
  //     MOCK_USERS[7], // user-emp-e1
  //   ],
  //   leadTechnician: MOCK_USERS[2], // user-lead-1
  //   tasks: [
  //     {
  //       id: "task-5",
  //       description: "เปลี่ยนหลอดไฟ",
  //       details: "เปลี่ยนหลอด LED 18W จำนวน 5 หลอด",
  //       isCompleted: true,
  //       order: 0,
  //     },
  //   ],
  //   createdAt: "2025-11-23T10:00:00.000Z",
  //   startDate: "2025-11-23",
  //   endDate: "2025-11-23",
  //   location: { lat: 13.7563, lng: 100.5018, name: "ลานจอดรถ B1" },
  //   locationImages: [],
  //   attachments: [],
  //   beforeImages: [],
  //   afterImages: [],
  //   usedInventory: [],
  //   customerName: null,
  //   customerPhone: null,
  //   signature:
  //     "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  //   rejectionReason: null,
  //   workLogs: [],
  // },
];

export const MOCK_ATTACHMENTS: Attachment[] = [
  {
    id: "att-001",
    fileName: "Maintenance_Report_Q4.pdf",
    fileType: "application/pdf",
    size: 1245678, // ขนาดไฟล์ (bytes)
    url: "/attachments/Maintenance_Report_Q4.pdf", // หรือ URL เต็ม
    uploadedAt: "2025-10-19T10:30:00.000Z",
  },
  {
    id: "att-002",
    fileName: "attach-2.pdf",
    fileType: "image/jpeg",
    size: 834502,
    url: "/attach-2.pdf",
    uploadedAt: "2025-10-20T08:15:00.000Z",
  },
  {
    id: "att-003",
    fileName: "attach-1.png",
    fileType: "image/png",
    size: 2150990,
    url: "/attach-1.png",
    uploadedAt: "2025-10-18T14:00:00.000Z",
  },
];
