// src/stores/userStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { User } from "@/lib/types/user";
import { MOCK_USERS } from "@/lib/mocks/user";
import { useAuditLogStore } from "./auditLogStore";

interface Credentials {
  email: string;
  password: string;
}

interface UserStoreState {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
  switchUserById: (userId: string) => void;

  createUser: (userData: Omit<User, "id" | "imageUrl"> & { imageUrl?: string | null }) => void;
  updateUser: (userId: string, updatedData: Partial<Omit<User, "id">>) => void;
  deleteUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
  resetUsers: () => void;
  reorderUsers: (userIdOrder: string[]) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    immer((set, get) => ({
      users: [],
      currentUser: null,
      isAuthenticated: false,
      isHydrated: false,

      login: async ({ email, password }) => {
        console.log("UserStore: Attempting login with:", { email, password });
        const allUsers = get().users;
        const foundUser = allUsers.find((u) => u.email === email && u.password === password);

        if (foundUser) {
          set((state) => {
            state.isAuthenticated = true;
            state.currentUser = foundUser;
          });
          console.log(`✅ UserStore: User ${foundUser.name} (${foundUser.role}) logged in.`);
          return true;
        } else {
          set((state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
          });
          console.warn("❌ UserStore: Login failed: Invalid credentials.");
          return false;
        }
      },

      logout: () => {
        set((state) => {
          state.isAuthenticated = false;
          state.currentUser = null;
        });
        console.log("👋 UserStore: User logged out.");
      },

      switchUserById: (userId: string) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
          set((state) => {
            state.currentUser = user;
            state.isAuthenticated = true;
          });
          console.log(`🔄 UserStore: Switched to user: ${user.name} (${user.role})`);
        } else {
          console.warn(`⚠️ UserStore: User with ID ${userId} not found for switching.`);
        }
      },

      createUser: (userData) => {
        let newUserId: string | null = null;
        set((state) => {
          if (state.users.some((u) => u.email === userData.email)) {
            console.error("❌ UserStore: Cannot create user, email already exists.");
            return;
          }
          const newUser: User = {
            id: crypto.randomUUID(),
            imageUrl: userData.imageUrl || null,
            ...userData,
            password: userData.password || "password123",
          };
          newUserId = newUser.id;
          state.users.push(newUser);
        });
        console.log("✅ UserStore: User created:", userData.name);
        
        // ✅ บันทึก audit log
        if (newUserId) {
          try {
            const currentUser = get().currentUser;
            if (currentUser) {
              useAuditLogStore.getState().addAuditLog({
                action: "create",
                entityType: "user",
                entityId: newUserId,
                entityName: userData.name,
                performedBy: {
                  id: currentUser.id,
                  name: currentUser.name,
                  role: currentUser.role,
                },
                details: `เพิ่มผู้ใช้ใหม่: ${userData.name} (${userData.email})`,
              });
            }
          } catch (error) {
            console.error("Failed to log audit:", error);
          }
        }
      },

      updateUser: (userId, updatedData) => {
        let updatedUser: User | null = null;
        let oldUserData: User | null = null;
        
        set((state) => {
          const userIndex = state.users.findIndex((user) => user.id === userId);
          if (userIndex !== -1) {
            if (
              updatedData.email &&
              state.users.some((u) => u.email === updatedData.email && u.id !== userId)
            ) {
              console.error("❌ UserStore: Cannot update user, email already exists.");
              return;
            }
            const currentUserData = state.users[userIndex];
            oldUserData = { ...currentUserData };
            state.users[userIndex] = {
              ...currentUserData,
              ...updatedData,
              password:
                updatedData.password === ""
                  ? currentUserData.password
                  : updatedData.password || currentUserData.password,
            };
            updatedUser = state.users[userIndex];
            console.log("✅ UserStore: User updated:", state.users[userIndex].name);
          } else {
            console.warn(`⚠️ UserStore: User with ID ${userId} not found for update.`);
          }
        });
        
        // ✅ บันทึก audit log
        if (updatedUser && oldUserData) {
          try {
            const currentUser = get().currentUser;
            if (currentUser) {
              const changes: { field: string; oldValue: any; newValue: any }[] = [];
              if (updatedData.name && updatedData.name !== oldUserData.name) {
                changes.push({ field: "name", oldValue: oldUserData.name, newValue: updatedData.name });
              }
              if (updatedData.email && updatedData.email !== oldUserData.email) {
                changes.push({ field: "email", oldValue: oldUserData.email, newValue: updatedData.email });
              }
              if (updatedData.role && updatedData.role !== oldUserData.role) {
                changes.push({ field: "role", oldValue: oldUserData.role, newValue: updatedData.role });
              }
              
              useAuditLogStore.getState().addAuditLog({
                action: "update",
                entityType: "user",
                entityId: updatedUser.id,
                entityName: updatedUser.name,
                performedBy: {
                  id: currentUser.id,
                  name: currentUser.name,
                  role: currentUser.role,
                },
                details: `แก้ไขข้อมูลผู้ใช้: ${updatedUser.name}`,
                changes: changes.length > 0 ? changes : undefined,
              });
            }
          } catch (error) {
            console.error("Failed to log audit:", error);
          }
        }
      },

      deleteUser: (userId) => {
        const userToDelete = get().users.find((u) => u.id === userId);
        
        set((state) => {
          if (state.currentUser?.id === userId) {
            console.warn("⚠️ UserStore: Cannot delete current logged-in user.");
            return;
          }
          state.users = state.users.filter((user) => user.id !== userId);
        });
        console.log(`🗑️ UserStore: User with ID ${userId} deleted.`);
        
        // ✅ บันทึก audit log
        if (userToDelete) {
          try {
            const currentUser = get().currentUser;
            if (currentUser) {
              useAuditLogStore.getState().addAuditLog({
                action: "delete",
                entityType: "user",
                entityId: userToDelete.id,
                entityName: userToDelete.name,
                performedBy: {
                  id: currentUser.id,
                  name: currentUser.name,
                  role: currentUser.role,
                },
                details: `ลบผู้ใช้: ${userToDelete.name} (${userToDelete.email})`,
              });
            }
          } catch (error) {
            console.error("Failed to log audit:", error);
          }
        }
      },
      reorderUsers: (userIdOrder: string[]) => {
        set((state) => {
          const idSet = new Set(userIdOrder);
          // Keep users that are in new order first, in that order, then append any missing users
          const ordered: any[] = [];
          for (const id of userIdOrder) {
            const u = state.users.find((x) => x.id === id);
            if (u) ordered.push(u);
          }
          for (const u of state.users) {
            if (!idSet.has(u.id)) ordered.push(u);
          }
          state.users = ordered;
        });
      },

      getUserById: (userId: string) => {
        return get().users.find((user) => user.id === userId);
      },

      resetUsers: () => {
        set((state) => {
          state.users = MOCK_USERS;
          state.currentUser = null;
          state.isAuthenticated = false;
        });
        console.log("♻️ UserStore: Reset users to MOCK_USERS.");
      },
    })),
    {
      name: "user-management-storage",
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state) => {
        console.log("🔄 UserStore: onRehydrateStorage triggered.");

        if (!state || !state.users || state.users.length === 0) {
          console.log("🧩 UserStore: No users found in persisted state. Loading MOCK_USERS...");
          (state as UserStoreState).users = MOCK_USERS;
        } else {
          console.log(
            `📦 UserStore: Found persisted users (${state.users.length}). Keeping existing data.`
          );
        }

        if (state) {
          (state as UserStoreState).isHydrated = true;
          console.log("✅ UserStore: Store hydrated successfully.");
        } else {
          console.warn("⚠️ UserStore: onRehydrateStorage called with null state.");
        }
      },

      migrate: (persistedState, version) => {
        if (version === 0) {
          const state = persistedState as any;
          if (typeof state.isAuthenticated === "undefined") state.isAuthenticated = false;
          if (typeof state.currentUser === "undefined") state.currentUser = null;
          if (typeof state.isHydrated === "undefined") state.isHydrated = false;
          if (state.users) {
            state.users = state.users.map((user: User) => ({
              ...user,
              email: user.email || `migrated-${user.id.substring(0, 4)}@example.com`,
              password: user.password || "password123",
              role:
                user.role &&
                ["manager", "lead_technician", "employee", "admin"].includes(user.role)
                  ? user.role
                  : "employee",
            }));
          }
        }
        return persistedState as UserStoreState;
      },
      version: 1,
    }
  )
);
