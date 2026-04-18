import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { User } from "@/lib/types/user";

interface UserStoreState {
  users: User[];
  fetchUsers: () => Promise<void>;
  createUser: (userData: Omit<User, "id" | "imageUrl"> & { imageUrl?: string | null; password?: string }) => Promise<void>;
  updateUser: (userId: string, updatedData: Partial<Omit<User, "id">>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
  reorderUsers: (userIdOrder: string[]) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    immer((set, get) => ({
      users: [],

      createUser: async (userData) => {
        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to create user");
          }

          set((state) => {
            state.users.push(result.data);
          });
          console.log("✅ UserStore: User created:", result.data.name);
        } catch (error: any) {
          console.error("❌ UserStore: Create user failed", error);
          throw error;
        }
      },

      updateUser: async (userId, updatedData) => {
        try {
          const res = await fetch(`/api/users?id=${userId}`, {
            method: "PATCH", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update user");
          }

          set((state) => {
            const index = state.users.findIndex((u) => u.id === userId);
            if (index !== -1) {
              state.users[index] = { ...state.users[index], ...result.data };
            }
          });
           console.log("✅ UserStore: User updated:", userId);
        } catch (error) {
           console.error("❌ UserStore: Update user failed", error);
        }
      },

      deleteUser: async (userId) => {
        try {
          const res = await fetch(`/api/users?id=${userId}`, {
            method: "DELETE",
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to delete user");
          }

          set((state) => {
            state.users = state.users.filter((user) => user.id !== userId);
          });
           console.log("✅ UserStore: User deleted:", userId);
        } catch (error) {
           console.error("❌ UserStore: Delete user failed", error);
        }
      },

      reorderUsers: (userIdOrder: string[]) => {
        set((state) => {
          const idSet = new Set(userIdOrder);
          const ordered: User[] = [];
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

      fetchUsers: async () => {
        try {
          const res = await fetch('/api/users');
          const result = await res.json();
          
          if (!res.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch users');
          }

          set({ users: result.data });
          console.log("✅ UserStore: Fetched users from API.");
        } catch (error) {
           console.error("❌ UserStore: Failed to fetch users", error);
        }
      },
    })),
    {
      name: "user-management-storage",
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state.fetchUsers();
        }
      },
      version: 1,
    }
  )
);
