export interface User {
  id: string;
  name: string;
  imageUrl?: string | null;
  role: 'admin' | 'manager' | 'lead_technician' | 'employee';
  department?: string | null; // ✅ เพิ่ม field นี้
  email?: string;
  password?: string;
}
