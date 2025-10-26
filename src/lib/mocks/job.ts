import { Job, Attachment } from "../types/job";
import { MOCK_USERS } from "./user";

export const MOCK_JOBS: Job[] = [
  {
    id: "job-001",
    title: "ซ่อมเครื่องปรับอากาศ ชั้น 5",
    description: "แอร์ห้องประชุมใหญ่ไม่เย็น มีน้ำหยด",
    status: "pending",
    department: "Maintenance",
    creator: {
      id: "user-manager-1",
      name: "วิภา หัวหน้าทีม",
      role: "manager"
    },
    assignedEmployees: [
        MOCK_USERS[3], // อ้างอิง user-emp-1
        MOCK_USERS[4]  // อ้างอิง user-emp-2
    ],
    leadTechnician: MOCK_USERS[2], // อ้างอิง user-lead-1
    tasks: [
      {
        id: "task-1",
        description: "ตรวจสอบระบบน้ำยาแอร์",
        details: null,
        isCompleted: false,
        order: 0,
      },
      {
        id: "task-2",
        description: "ล้างแผ่นกรอง",
        details: "ใช้น้ำแรงดันสูงฉีดล้าง",
        isCompleted: false,
        order: 1,
      }
    ],
    createdAt: "2025-10-20T09:00:00.000Z",
    startDate: "2025-10-21",
    endDate: "2025-10-22",
    location: { lat: 13.7563, lng: 100.5018, name: "อาคารสำนักงานใหญ่" },
    attachments: []
  },
  {
    id: "job-002",
    title: "ติดตั้งโปรแกรม Antivirus ใหม่",
    description: null,
    status: "in_progress",
    department: "IT Support",
    creator: { id: "user-admin-1", name: "สมชาย จัดการเก่ง", role: "admin" },
    assignedEmployees: [MOCK_USERS[3]],
    leadTechnician: null,
    tasks: [],
    createdAt: "2025-10-24T14:30:00.000Z",
    attachments: []
  }
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