import { User } from "./user";

export interface Task {
  id: string;
  description: string;
  details: string | null;
  isCompleted: boolean;
  order: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  status:
    | "pending"
    | "in_progress"
    | "pending_approval"
    | "completed"
    | "cancelled"
    | "rejected";
  departments: string[]; // เปลี่ยนเป็น array สำหรับหลาย departments
  type?: "บ้าน" | "คอนโด" | "อาคาร" | null;
  priority?: "low" | "medium" | "high" | "urgent" | null;
  creator: { id: string; name: string; role: User["role"] };
  creatorName?: string;
  assignedEmployees: User[];
  leadTechnician: User | null;
  tasks: Task[];
  usedInventory?: { id: string; qty: number }[];
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: { lat: number; lng: number; name?: string | null } | null;
  locationImages?: string[]; // รูปภาพสถานที่ (หลายรูป)
  attachments: Attachment[];
  beforeImages?: string[]; // รูปภาพก่อนซ่อม
  afterImages?: string[]; // รูปภาพหลังซ่อม
  workLogs?: Array<{
    id: string;
    date: string;
    updatedBy: { id: string; name: string };
    status: Job["status"];
    note: string;
    createdAt: string;
  }>;
  customerType?: "individual" | "organization" | null; // ประเภทลูกค้า: ปกติ หรือ องค์กร
  customerName?: string | null; // ชื่อลูกค้าปกติ หรือ ชื่อผู้ติดต่อ (สำหรับองค์กร)
  customerPhone?: string | null;
  // ข้อมูลลูกค้าองค์กร
  customerCompanyName?: string | null; // ชื่อบริษัท/องค์กร
  customerTaxId?: string | null; // เลขประจำตัวผู้เสียภาษี
  customerAddress?: string | null; // ที่อยู่บริษัท
  signature?: string | null;
  rejectionReason?: string | null; // เหตุผลการ reject จาก lead_technician
}
