import { Report } from "@/stores/features/reportStore";

export const MOCK_REPORTS: Report[] = [
  {
    id: "report-001",
    title: "ระบบ Login ไม่สามารถเข้าสู่ระบบได้บน Safari",
    description:
      "เมื่อพยายามเข้าสู่ระบบผ่าน Safari browser บน macOS จะเกิด error และไม่สามารถเข้าสู่ระบบได้ แต่บน Chrome ใช้งานได้ปกติ",
    type: "bug",
    status: "open",
    createdAt: "2025-11-21T10:30:00Z",
    updatedAt: null,
    reporter: {
      id: "user-emp-e1",
      name: "นาย สมควร ลาโลก",
      imageUrl: "https://i.pravatar.cc/150?u=emp-e1",
    },
    assignee: null,
    priority: "high",
    tags: ["frontend", "safari", "login"],
  },
  {
    id: "report-002",
    title: "ขอเพิ่มฟีเจอร์ Export รายงานเป็น PDF",
    description:
      "ต้องการให้สามารถ Export รายงานการทำงานเป็นไฟล์ PDF เพื่อส่งให้หัวหน้าทีมได้",
    type: "request",
    status: "in_progress",
    createdAt: "2025-11-21T14:20:00Z",
    updatedAt: "2025-11-21T09:15:00Z",
    reporter: {
      id: "user-emp-e2",
      name: "นางสาว พิรัย กรรม",
      imageUrl: "https://i.pravatar.cc/150?u=emp-e2",
    },
    assignee: {
      id: "user-lead-1",
      name: "สมศักดิ์ ช่างใหญ่",
      imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    },
    priority: "medium",
    tags: ["feature", "export", "pdf"],
  },
  {
    id: "report-003",
    title: "อุปกรณ์ปั๊มน้ำชำรุดระหว่างใช้งาน",
    description:
      "ปั๊มน้ำ PW-200 ที่ใช้ในงานซ่อมประปาเกิดเสียงผิดปกติและหยุดทำงานทันที ต้องส่งซ่อมด่วน",
    type: "incident",
    status: "resolved",
    createdAt: "2025-11-21T08:45:00Z",
    updatedAt: "2025-11-21T16:30:00Z",
    reporter: {
      id: "user-emp-m1",
      name: "นาย มาลี แหม่ม",
      imageUrl: "https://i.pravatar.cc/150?u=emp-m1",
    },
    assignee: {
      id: "user-manager-1",
      name: "วิภา หัวหน้าทีม",
      imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    },
    relatedInventoryId: "inv-001",
    priority: "urgent",
    tags: ["equipment", "maintenance"],
  },
  {
    id: "report-004",
    title: "ปรับปรุงระบบแจ้งเตือนให้ชัดเจนขึ้น",
    description:
      "ระบบแจ้งเตือนปัจจุบันไม่ชัดเจนพอ ควรเพิ่มเสียงแจ้งเตือนและแสดง popup ที่เด่นชัดขึ้น",
    type: "improvement",
    status: "open",
    createdAt: "2025-11-21T11:00:00Z",
    updatedAt: null,
    reporter: {
      id: "user-emp-m2",
      name: "นาย คิง โซเยอร์",
      imageUrl: "https://i.pravatar.cc/150?u=emp-m2",
    },
    assignee: null,
    priority: "low",
    tags: ["ui", "notification"],
  },
  {
    id: "report-005",
    title: "หน้าจอแสดงข้อมูล Job กระพริบเมื่อโหลดข้อมูล",
    description:
      "เมื่อเข้าหน้า Job detail หน้าจอจะกระพริบหลายครั้งก่อนจะแสดงข้อมูล ซึ่งทำให้ผู้ใช้สับสน",
    type: "bug",
    status: "in_progress",
    createdAt: "2025-11-21T15:30:00Z",
    updatedAt: "2025-11-21T10:20:00Z",
    reporter: {
      id: "user-emp-e3",
      name: "นางสาว สมศรี เรืองแสง",
      imageUrl: "https://i.pravatar.cc/150?u=emp-e3",
    },
    assignee: {
      id: "user-lead-1",
      name: "สมศักดิ์ ช่างใหญ่",
      imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    },
    relatedJobId: "job-001",
    priority: "medium",
    tags: ["ui", "performance"],
  },
  {
    id: "report-007",
    title: "ระบบล่มชั่วคราวเมื่อมีผู้ใช้เข้าพร้อมกันมาก",
    description:
      "เมื่อมีผู้ใช้เข้าถึงระบบพร้อมกันมากกว่า 50 คน ระบบจะล่มชั่วคราวและต้องรีสตาร์ทเซิร์ฟเวอร์",
    type: "incident",
    status: "resolved",
    createdAt: "2025-11-21T13:45:00Z",
    updatedAt: "2025-11-21T11:30:00Z",
    reporter: {
      id: "user-emp-m3",
      name: "นาย อูโน่ หลาวทอง",
      imageUrl: "https://i.pravatar.cc/150?u=emp-m3",
    },
    assignee: {
      id: "user-admin-1",
      name: "สมชาย จัดการเก่ง",
      imageUrl: "https://i.pravatar.cc/150?u=admin1",
    },
    priority: "urgent",
    tags: ["server", "performance"],
  },
  {
    id: "report-008",
    title: "ปรับปรุง UX ของฟอร์มเพิ่ม Job",
    description:
      "ฟอร์มเพิ่ม Job ควรมี auto-save และ validation ที่ดีขึ้น เพื่อป้องกันการสูญเสียข้อมูล",
    type: "improvement",
    status: "open",
    createdAt: "2025-11-21T10:20:00Z",
    updatedAt: null,
    reporter: {
      id: "user-emp-m4",
      name: "นาย ทนงทวย คงควรคอย",
      imageUrl: "https://i.pravatar.cc/150?u=emp-m4",
    },
    assignee: null,
    priority: "medium",
    tags: ["ux", "form"],
  },
];
