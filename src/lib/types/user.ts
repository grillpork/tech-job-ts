export type UserRole = 'admin' | 'manager' | 'lead_technician' | 'employee' | `lead_${string}`;
export interface User {
  id: string;
  name: string;
  imageUrl?: string | null;
  role: UserRole;
  department?: string | null; // ✅ เพิ่ม field นี้
  email?: string;
  status? : string
  password?: string;
  coverImageUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  skills?: string[];
  joinedAt?: string | null; // ISO date
  address?: string | null;
  linkedin?: string | null;
  employeeId?: string | null;
  github?: string | null;
  employmentType?: string | null; // e.g. Full-time, Contractor
  accountTier?: string | null; // for internal account access tiers
  referralCode?: string | null;
  accountProgressTier?: string | null;
  facebook?: string | null;
  lineId?: string | null;
}
