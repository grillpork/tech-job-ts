import { User } from "../types/user";

export const MOCK_USERS: User[] = [
  {
    id: "user-admin-1",
    name: "สมชาย จัดการเก่ง",
    role: "admin",
    imageUrl: "https://i.pravatar.cc/150?u=admin1", 
    email: "somchai.admin@company.com",
    password: "password123"
  },
  {
    id: "user-manager-1",
    name: "วิภา หัวหน้าทีม",
    role: "manager",
    imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    email: "wipa.manager@company.com",
    password: "password123"
  },
  {
    id: "user-lead-1",
    name: "สมศักดิ์ ช่างใหญ่",
    role: "lead_technician",
    email: "somsak.lead@company.com",
    password: "password123"
  },
  {
    id: "user-emp-1",
    name: "นาย ก. พนักงาน",
    role: "employee",
    email: "emp1@company.com",
    password: "password123"
  },
  {
    id: "user-emp-2",
    name: "นางสาว ข. พนักงาน",
    role: "employee",
    email: "emp2@company.com",
    password: "password123"

  }
];
