// src/stores/userStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { User } from "@/lib/types/user";


interface UserStoreState {
  users: User[];
  fetchUsers: () => Promise<void>;
  
  // Management Actions
  // Management Actions
  createUser: (userData: Omit<User, "id" | "imageUrl"> & { imageUrl?: string | null }) => Promise<void>;
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

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.message || resData.error || "Failed to create user");
          }

          const newUser = resData.data;

          // 2. Update Local State
          set((state) => {
            state.users.unshift(newUser);
          });
          console.log("✅ UserStore: User created:", newUser.name);
        } catch (error: any) {
          console.error("❌ UserStore: Create user failed", error.message);
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

           const resData = await res.json();

           if (!res.ok) {
             throw new Error(resData.message || resData.error || "Failed to update user");
           }
           
           const updatedUser = resData.data;

          set((state) => {
            const index = state.users.findIndex((u) => u.id === userId);
            if (index !== -1) {
              state.users[index] = { ...state.users[index], ...updatedUser };
            }
          });
          console.log("✅ UserStore: User updated:", userId);
        } catch (error: any) {
           console.error("❌ UserStore: Update user failed", error.message);
           throw error;
        }
      },

      deleteUser: async (userId) => {
        try {
          const res = await fetch(`/api/users?id=${userId}`, {
            method: "DELETE",
          });

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.message || resData.error || "Failed to delete user");
          }

          set((state) => {
            state.users = state.users.filter((user) => user.id !== userId);
          });
           console.log("✅ UserStore: User deleted:", userId);
        } catch (error: any) {
           console.error("❌ UserStore: Delete user failed", error.message);
           throw error;
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
          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.message || resData.error || 'Failed to fetch users');
          }

          // Handle both raw array and structured response { success, data, ... }
          const users = Array.isArray(resData) ? resData : resData.data;
          
          if (!Array.isArray(users)) {
            throw new Error('Invalid user data received from server');
          }

          set({ users });
          console.log("✅ UserStore: Fetched users from API.");
        } catch (error: any) {
           console.error("❌ UserStore: Failed to fetch users:", error.message);
           throw error; // Re-throw to let UI handle the error (e.g. show toast)
        }
      },
    })),
    {
      name: "user-management-storage",
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state) => {
        console.log("🔄 UserStore: onRehydrateStorage triggered.");
        if (state) {
          state.fetchUsers();
          console.log("✅ UserStore: Store hydrated and fetch triggered.");
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persistedState, _version) => {
        // Simplified migration as authentication is removed
        return persistedState as UserStoreState;
      },
      version: 1,
    }
  )
);
