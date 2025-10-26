// src/stores/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { faker } from '@faker-js/faker'; // สำหรับสร้างข้อมูล Mock User

// --- Type Definitions ---
// กำหนดโครงสร้างข้อมูลสำหรับ User
export interface User {
  id: string;
  name: string;
  imageUrl?: string | null; // URL รูปภาพโปรไฟล์ (อาจมีหรือไม่มีก็ได้)
  role: 'admin' | 'manager' | 'lead_technician' | 'employee'; // บทบาทของผู้ใช้
  email?: string; // Email ผู้ใช้
  password?: string;
}

interface Credentials {
  email: string;
  password: string;
}

interface UserStoreState {
  users: User[]; 
  currentUser: User | null;
  isAuthenticated: boolean; // สถานะการ Login
  isHydrated: boolean; // สถานะบ่งชี้ว่า Store โหลดข้อมูลจาก Local Storage เสร็จแล้วหรือไม่
  
  // Auth Actions: การกระทำที่เกี่ยวข้องกับการยืนยันตัวตน
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
  switchUserById: (userId: string) => void; // สำหรับสลับผู้ใช้ (ใช้ใน UserSwitcher)

  // CRUD User Actions: การกระทำที่เกี่ยวข้องกับการจัดการข้อมูลผู้ใช้
  createUser: (userData: Omit<User, 'id' | 'imageUrl'> & { imageUrl?: string | null }) => void;
  updateUser: (userId: string, updatedData: Partial<Omit<User, 'id'>>) => void;
  deleteUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined; // ดึงข้อมูลผู้ใช้ตาม ID
}

// --- Mock Data Generator ---
// ฟังก์ชันสำหรับสร้างข้อมูลผู้ใช้แบบสุ่ม (ใช้สำหรับข้อมูลเริ่มต้น)
export const createRandomUser = (role: User['role'], customEmail?: string, customPassword?: string, customName?: string): User => ({
  id: faker.string.uuid(), // ID ผู้ใช้แบบ Unique
  name: customName || faker.person.fullName(), // ชื่อผู้ใช้
  imageUrl: faker.image.avatar(), // รูปภาพ Avatar สุ่ม
  role, // บทบาทที่กำหนด
  email: customEmail || faker.internet.email().toLowerCase(), // Email สุ่ม หรือที่กำหนดเอง
  password: customPassword || "password123", // รหัสผ่านสุ่ม หรือที่กำหนดเอง
});

export const useUserStore = create<UserStoreState>()(
  persist( // ใช้ persist middleware ของ Zustand เพื่อเก็บข้อมูลใน Local Storage
    immer((set, get) => ({ // ใช้ immer middleware เพื่อให้สามารถแก้ไข state โดยตรงได้
      users: [], // เริ่มต้นด้วย Array ผู้ใช้ว่างเปล่า
      currentUser: null, // ยังไม่มีผู้ใช้ Login
      isAuthenticated: false, // ยังไม่ผ่านการยืนยันตัวตน
      isHydrated: false, // ค่าเริ่มต้นเป็น false: Store ยังไม่ได้โหลดข้อมูลจาก Local Storage

      // --- Auth Actions Implementations ---
      // ฟังก์ชัน Login
      login: async ({ email, password }) => {
        console.log("UserStore: Attempting login with:", { email, password });
        const allUsers = get().users; // ดึงผู้ใช้ทั้งหมด

        // ค้นหาผู้ใช้ที่ตรงกับ email และ password
        const foundUser = allUsers.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          // ถ้าพบผู้ใช้ ให้ตั้งค่า isAuthenticated เป็น true และ currentUser เป็นผู้ใช้ที่พบ
          set((state) => {
            state.isAuthenticated = true;
            state.currentUser = foundUser;
          });
          console.log(`UserStore: User ${foundUser.name} (${foundUser.role}) logged in.`);
          return true; // Login สำเร็จ
        } else {
          // ถ้าไม่พบผู้ใช้ ให้รีเซ็ตสถานะ Login
          set((state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
          });
          console.log("UserStore: Login failed: Invalid credentials.");
          return false; // Login ล้มเหลว
        }
      },
      // ฟังก์ชัน Logout
      logout: () => {
        set((state) => {
          state.isAuthenticated = false;
          state.currentUser = null;
        });
        console.log("UserStore: User logged out.");
      },

      // ฟังก์ชันสลับผู้ใช้ (สำหรับ UserSwitcher)
      switchUserById: (userId: string) => {
        const user = get().users.find(u => u.id === userId); // หาผู้ใช้ตาม ID
        if (user) {
          // ถ้าพบผู้ใช้ ให้ตั้งเป็น currentUser และตั้ง isAuthenticated เป็น true
          set((state) => {
            state.currentUser = user;
            state.isAuthenticated = true;
          });
          console.log(`UserStore: Switched to user: ${user.name} (${user.role})`);
        } else {
          console.warn(`UserStore: User with ID ${userId} not found for switching.`);
        }
      },

      // --- CRUD User Actions Implementations ---
      // ฟังก์ชันสร้างผู้ใช้ใหม่
      createUser: (userData) => {
        set((state) => {
          // ตรวจสอบว่ามี email ซ้ำหรือไม่
          if (state.users.some(u => u.email === userData.email)) {
            console.error("UserStore: Cannot create user, email already exists.");
            return;
          }
          const newUser: User = {
            id: faker.string.uuid(), // สร้าง ID ใหม่
            imageUrl: userData.imageUrl || faker.image.avatar(), // ใช้ imageUrl ที่ให้มา หรือสร้างสุ่ม
            ...userData,
            password: userData.password || "password123", // ใช้ password ที่ให้มา หรือค่า default
          };
          state.users.push(newUser); // เพิ่มผู้ใช้ใหม่เข้าใน Array
        });
        console.log("UserStore: User created:", userData.name);
      },

      // ฟังก์ชันอัปเดตข้อมูลผู้ใช้
      updateUser: (userId, updatedData) => {
        set((state) => {
          const userIndex = state.users.findIndex((user) => user.id === userId);
          if (userIndex !== -1) {
            // ตรวจสอบว่า email ใหม่ซ้ำกับผู้ใช้อื่นหรือไม่ (ยกเว้นตัวผู้ใช้เอง)
            if (updatedData.email && state.users.some(u => u.email === updatedData.email && u.id !== userId)) {
              console.error("UserStore: Cannot update user, email already exists for another user.");
              return;
            }

            const currentUserData = state.users[userIndex];
            state.users[userIndex] = { 
              ...currentUserData, // เก็บข้อมูลเดิม
              ...updatedData, // อัปเดตด้วยข้อมูลใหม่
              // Logic สำหรับ password: ถ้า updatedData.password เป็น "", ให้ใช้ password เดิม
              // มิฉะนั้น ให้ใช้ updatedData.password (หรือ password เดิมถ้า updatedData.password เป็น undefined)
              password: updatedData.password === "" ? currentUserData.password : updatedData.password || currentUserData.password
            };
            console.log("UserStore: User updated:", state.users[userIndex].name);
          } else {
            console.warn(`UserStore: User with ID ${userId} not found for update.`);
          }
        });
      },

      // ฟังก์ชันลบผู้ใช้
      deleteUser: (userId) => {
        set((state) => {
          // ป้องกันการลบผู้ใช้ที่กำลัง Login อยู่
          if (state.currentUser?.id === userId) {
            console.warn("UserStore: Cannot delete current logged-in user.");
            return;
          }
          state.users = state.users.filter((user) => user.id !== userId); // กรองผู้ใช้ออก
        });
        console.log(`UserStore: User with ID ${userId} deleted.`);
      },
      
      // ฟังก์ชันดึงข้อมูลผู้ใช้ตาม ID
      getUserById: (userId: string) => {
        return get().users.find(user => user.id === userId);
      }
    })),
    {
      name: 'user-management-storage', // ชื่อ Key สำหรับ Local Storage
      storage: createJSONStorage(() => localStorage), // ใช้ Local Storage
      // onRehydrateStorage ถูกเรียกเมื่อ Store โหลดข้อมูลจาก Local Storage เสร็จ
      onRehydrateStorage: () => (state) => {
          // หากไม่มีผู้ใช้ใน Local Storage หรือ Array ว่างเปล่า ให้สร้างข้อมูล Mock User เริ่มต้น
          if (state && (!state.users || state.users.length === 0)) {
              console.log("UserStore: Initializing mock users in onRehydrateStorage...");
              const initialUsers: User[] = [
                  createRandomUser('admin', "admin@example.com", "password123", "Admin User"),
                  createRandomUser('manager', "manager@example.com", "password123", "Manager User"),
                  createRandomUser('lead_technician', "lead@example.com", "password123", "Lead Tech User"),
                  createRandomUser('employee', "employee@example.com", "password123", "Employee User"),
                  ...Array.from({ length: 5 }, () => createRandomUser('employee')),
                  ...Array.from({ length: 2 }, () => createRandomUser('manager'))
              ];
              (state as UserStoreState).users = initialUsers;
              (state as UserStoreState).currentUser = null;
              (state as UserStoreState).isAuthenticated = false;
          } else {
            console.log("UserStore: Users already exist in store or rehydrated.");
          }
          // ตั้งค่า isHydrated เป็น true เพื่อบ่งชี้ว่า Store พร้อมใช้งานแล้ว
          if (state) {
            (state as UserStoreState).isHydrated = true;
            console.log("UserStore: Store has been hydrated. isHydrated = true."); // เพิ่ม Log สำหรับ Debug
          } else {
            console.warn("UserStore: onRehydrateStorage called with null state, isHydrated not set."); // เพิ่ม Log สำหรับ Debug
          }
      },
      // migrate ใช้สำหรับจัดการการเปลี่ยนแปลงโครงสร้าง Store ระหว่าง Version
      migrate: (persistedState, version) => {
        if (version === 0) { // สำหรับการ migrate จาก version 0
          const state = persistedState as any;
          // กำหนดค่าเริ่มต้นสำหรับ field ใหม่ที่อาจไม่มีใน version เก่า
          if (typeof state.isAuthenticated === 'undefined') {
            state.isAuthenticated = false;
          }
          if (typeof state.currentUser === 'undefined') {
            state.currentUser = null;
          }
          if (typeof state.isHydrated === 'undefined') { // เพิ่ม migrate สำหรับ isHydrated
            state.isHydrated = false; // กำหนดค่าเริ่มต้นเป็น false
          }
          // ตรวจสอบและแก้ไขข้อมูลผู้ใช้หากจำเป็น
          if (state.users) {
            state.users = state.users.map((user: User) => ({
              ...user,
              email: user.email || faker.internet.email().toLowerCase(), // เพิ่ม email ถ้าไม่มี
              password: user.password || "password123", // เพิ่ม password ถ้าไม่มี
              role: user.role && ['manager', 'lead_technician', 'employee', 'admin'].includes(user.role) ? user.role : 'employee', 
            }));
          }
        }
        return persistedState as UserStoreState; // คืนค่า state ที่ migrate แล้ว
      },
      version: 1, // กำหนด Version ของ Store (ควรเพิ่มเมื่อมีการเปลี่ยนแปลงโครงสร้าง)
    }
  )
);