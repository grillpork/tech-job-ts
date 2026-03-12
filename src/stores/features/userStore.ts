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
          // 1. Call API
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to create user");
          }

          const newUser = await res.json();

          // 2. Update Local State
          set((state) => {
            state.users.push(newUser);
          });
          console.log("✅ UserStore: User created:", newUser.name);
        } catch (error) {
          console.error("❌ UserStore: Create user failed", error);
          throw error; // Re-throw for UI handling
        }
      },

      updateUser: async (userId, updatedData) => {
        try {
           // 1. Call API (Using PUT/PATCH to specific ID if exists, or query param)
           // We will create /api/users/[id] route next.
           const res = await fetch(`/api/users?id=${userId}`, { // Using query param for now if folders complex, OR assume dynamic route
             method: "PATCH", 
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(updatedData),
           });

           // Note: Ideally use /api/users/${userId}, but for simplicity in file creation I might just use one route file with params if simpler. 
           // actually, better to use standard REST: /api/users/${userId}
           // But I'll stick to /api/users with a method to handle updates if I don't want to make new folder yet? 
           // No, best practice: I will implement DELETE/PATCH in /api/users/route.ts handling ID from searchParams if easier, or create the folder.
           // Let's use `/api/users?id=${userId}` for simplicity in `route.ts` modification.

           if (!res.ok) {
             const errorData = await res.json().catch(() => ({}));
             throw new Error(errorData.error || errorData.message || "Failed to update user");
           }
           
           const updatedUser = await res.json();

          set((state) => {
            const index = state.users.findIndex((u) => u.id === userId);
            if (index !== -1) {
              state.users[index] = { ...state.users[index], ...updatedUser };
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

          if (!res.ok) throw new Error("Failed to delete user");

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
          if (!res.ok) throw new Error('Failed to fetch users');
          const users = await res.json();
          set({ users });
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
