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
    phone: "+66 81 234 5678",
    bio: "ผู้บริหารที่มีประสบการณ์ด้านการจัดการทีมและโครงการมานานกว่า 10 ปี ชอบพัฒนากระบวนการทำงานให้มีประสิทธิภาพ",
    skills: ["Management", "Planning", "KPI"],
    joinedAt: "2018-06-12",
    address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
    linkedin: "https://www.linkedin.com/in/somchai-admin",
    employeeId: "TCH-0001",
    github: "https://github.com/somchai-admin",
    employmentType: "Full-time",
    accountTier: "Admin",
    referralCode: "ADM001",
    accountProgressTier: "Tier 3",
    password: "password123",
  },
  {
    id: "user-manager-1",
    name: "วิภา หัวหน้าทีม",
    role: "manager",
    imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    email: "wipa.manager@company.com",
    phone: "+66 89 111 2222",
    bio: "หัวหน้าทีมดูแลโครงการภายในและประสานงานระหว่างแผนก เก่งด้านการวางแผนและสื่อสาร",
    skills: ["Team Lead", "Communication", "Scheduling"],
    joinedAt: "2019-02-01",
    address: "45/6 ถนนพระราม 3 แขวงช่องนนทรี เขตยานนาวา",
    linkedin: "https://www.linkedin.com/in/wipa-manager",
    employeeId: "TCH-0010",
    github: "https://github.com/wipa-manager",
    employmentType: "Full-time",
    accountTier: "Manager",
    referralCode: "MGR010",
    accountProgressTier: "Tier 2",
    password: "password123",
  },
  {
    id: "user-lead-1",
    name: "สมศักดิ์ ช่างใหญ่",
    role: "lead_technician",
    imageUrl: "https://i.pravatar.cc/150?u=mgr1",
    email: "somsak.lead@company.com",
    phone: "+66 82 333 4444",
    bio: "หัวหน้าช่างที่เชี่ยวชาญด้านการแก้ปัญหาหน้างานและการอบรมทีมช่าง",
    skills: ["Troubleshooting", "Mentoring", "Safety"],
    joinedAt: "2020-08-15",
    address: "ต.บ้านทับ อ.บางบัวทอง จ.นนทบุรี",
    employeeId: "TCH-0020",
    github: null,
    employmentType: "Full-time",
    accountTier: "Lead",
    referralCode: "LD020",
    accountProgressTier: "Tier 2",
    password: "password123",
  },

  // team Electrical
  {
    id: "user-emp-e1",
    name: "นาย สมควร ลาโลก",
    role: "employee",
    department: "Electrical", // ✅ พนักงานแผนกช่างไฟ
    email: "emp1@company.com",
    phone: "+66 84 555 6666",
    bio: "ช่างไฟฟ้าประสบการณ์ 3 ปี ถนัดงานติดตั้งและตรวจสอบระบบไฟฟ้า",
    skills: ["Wiring", "Inspection"],
    joinedAt: "2022-01-10",
    employeeId: "TCH-E101",
    github: null,
    employmentType: "Contractor",
    accountTier: "Employee",
    referralCode: "EMP101",
    accountProgressTier: "Tier 1",
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
    phone: "+66 86 777 8888",
    bio: "ช่างเครื่องกลชำนาญงานซ่อมบำรุงและอ่านแบบชิ้นส่วนเครื่องจักร",
    skills: ["Maintenance", "CAD"],
    joinedAt: "2021-05-20",
    employeeId: "TCH-M201",
    github: null,
    employmentType: "Full-time",
    accountTier: "Employee",
    referralCode: "EMP201",
    accountProgressTier: "Tier 1",
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
