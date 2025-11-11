//lib/mocks/user.ts
import { User } from "../types/user";

export const MOCK_USERS: User[] = [
  {
    id: "user-admin-1",
    name: "สมชาย จัดการเก่ง",
    role: "admin",
    imageUrl: "https://i.pravatar.cc/150?u=admin1",
    email: "somchai.admin@company.com",
    status: "active",
    password: "password123",
  },
  {
    id: "user-manager-1",
    name: "วิภา หัวหน้าทีม",
    role: "manager",
    imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    email: "wipa.manager@company.com",
    password: "password123",
  },
  {
    id: "user-lead-1",
    name: "สมศักดิ์ ช่างใหญ่",
    role: "lead_technician",
    email: "somsak.lead@company.com",
    password: "password123",
  },

  // team Electrical
  {
    id: "user-emp-e1",
    name: "นาย สมควร ลาโลก",
    role: "employee",
    department: "Electrical", // ✅ พนักงานแผนกช่างไฟ
    email: "emp1@company.com",
    password: "password123",
  },
  {
    id: "user-emp-e2",
    name: "นางสาว พิรัย กรรม ",
    role: "employee",
    department: "Electrical", // ✅ พนักงานแผนกช่างไฟ
    email: "emp2@company.com",
    password: "password123",
  },
  
  {
    id: "user-emp-e3",
    name: "นางสาว สมศรี เรืองแสง ",
    role: "employee",
    department: "Electrical", // ✅ พนักงานแผนกช่างไฟ
    email: "emp3@company.com",
    password: "password123",
  },

  {
    id: "user-emp-e4",
    name: "นาย ประยุบ อังคาร ",
    role: "employee",
    department: "Electrical", // ✅ พนักงานแผนกช่างไฟ
    email: "emp4@company.com",
    password: "password123",
  },

  {
    id: "user-emp-e5",
    name: "นาย สมศักดิ์ มาทำไม ",
    role: "employee",
    department: "Electrical", // ✅ พนักงานแผนกช่างไฟ
    email: "emp5@company.com",
    password: "password123",
  },

  // team Mechanical
  {
    id: "user-emp-m1",
    name: "นาย มาลี แหม่ม ",
    role: "employee",
    department: "Mechanical", // ✅ พนักงานแผนกช่างกล
    email: "emp-m1@company.com",
    password: "password123",
  },

  {
    id: "user-emp-m2",
    name: "นาย คิง โซเยอร์",
    role: "employee",
    department: "Mechanical", // ✅ พนักงานแผนกช่างกล
    email: "emp-m2@company.com",
    password: "password123",
  },

  {
    id: "user-emp-m3",
    name: "นาย อูโน่ หลาวทอง",
    role: "employee",
    department: "Mechanical", // ✅ พนักงานแผนกช่างกล
    email: "emp-m3@company.com",
    password: "password123",
  },

  {
    id: "user-emp-m4",
    name: "นาย ทนงทวย คงควรคอย",
    role: "employee",
    department: "Mechanical", // ✅ พนักงานแผนกช่างกล
    email: "emp-m4@company.com",
    password: "password123",
  },

  {
    id: "user-emp-m5",
    name: "นาย สัญญา ชอบโกหก",
    role: "employee",
    department: "Mechanical", // ✅ พนักงานแผนกช่างกล
    email: "emp-m5@company.com",
    password: "password123",
  },

  // team Civil
  {
    id: "user-emp-4",
    name: "นาง ง. (ช่างโยธา)",
    role: "employee",
    department: "Civil", // ✅ พนักงานแผนกช่างโยธา
    email: "emp4@company.com",
    password: "password123",
  },

  // team Technical
  {
    id: "user-emp-5",
    name: "นาย จ. (ช่างเทคนิค)",
    role: "employee",
    department: "Technical", // ✅ พนักงานแผนกช่างเทคนิค
    email: "emp5@company.com",
    password: "password123",
  },
];
