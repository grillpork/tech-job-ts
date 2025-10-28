// src/stores/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User } from '@/lib/types/user';
import { MOCK_USERS } from '@/lib/mocks/user';

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

  createUser: (userData: Omit<User, 'id' | 'imageUrl'> & { imageUrl?: string | null }) => void;
  updateUser: (userId: string, updatedData: Partial<Omit<User, 'id'>>) => void;
  deleteUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
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
        const foundUser = allUsers.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          set((state) => {
            state.isAuthenticated = true;
            state.currentUser = foundUser;
          });
          console.log(`UserStore: User ${foundUser.name} (${foundUser.role}) logged in.`);
          return true;
        } else {
          set((state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
          });
          console.log("UserStore: Login failed: Invalid credentials.");
          return false;
        }
      },
      logout: () => {
        set((state) => {
          state.isAuthenticated = false;
          state.currentUser = null;
        });
        console.log("UserStore: User logged out.");
      },
      switchUserById: (userId: string) => {
        const user = get().users.find(u => u.id === userId);
        if (user) {
          set((state) => {
            state.currentUser = user;
            state.isAuthenticated = true;
          });
          console.log(`UserStore: Switched to user: ${user.name} (${user.role})`);
        } else {
          console.warn(`UserStore: User with ID ${userId} not found for switching.`);
        }
      },

      createUser: (userData) => {
        set((state) => {
          if (state.users.some((u) => u.email === userData.email)) {
            console.error("UserStore: Cannot create user, email already exists.");
            return;
          }
          const newUser: User = {
            id: crypto.randomUUID(), 
            imageUrl: userData.imageUrl || null,
            ...userData,
            password: userData.password || "password123",
          };
          state.users.push(newUser);
        });
        console.log("UserStore: User created:", userData.name);
      },

      updateUser: (userId, updatedData) => {
        set((state) => {
          const userIndex = state.users.findIndex((user) => user.id === userId);
          if (userIndex !== -1) {
            if (updatedData.email && state.users.some((u) => u.email === updatedData.email && u.id !== userId)) {
              console.error("UserStore: Cannot update user, email already exists for another user.");
              return;
            }
            const currentUserData = state.users[userIndex];
            state.users[userIndex] = { 
              ...currentUserData, 
              ...updatedData,
              password: updatedData.password === "" ? currentUserData.password : updatedData.password || currentUserData.password
            };
            console.log("UserStore: User updated:", state.users[userIndex].name);
          } else {
            console.warn(`UserStore: User with ID ${userId} not found for update.`);
          }
        });
      },
      deleteUser: (userId) => {
        set((state) => {
          if (state.currentUser?.id === userId) {
            console.warn("UserStore: Cannot delete current logged-in user.");
            return;
          }
          state.users = state.users.filter((user) => user.id !== userId);
        });
        console.log(`UserStore: User with ID ${userId} deleted.`);
      },
      getUserById: (userId: string) => {
        return get().users.find(user => user.id === userId);
      }
    })),
    {
      name: 'user-management-storage',
      storage: createJSONStorage(() => localStorage),
      
      onRehydrateStorage: () => (state) => {
          if (state && (!state.users || state.users.length === 0)) {
              console.log("UserStore: Initializing mock users from MOCK_USERS array...");
              (state as UserStoreState).users = MOCK_USERS; 

              (state as UserStoreState).currentUser = null;
              (state as UserStoreState).isAuthenticated = false;
          } else {
            console.log("UserStore: Users already exist in store or rehydrated.");
          }
          
          if (state) {
            (state as UserStoreState).isHydrated = true;
            console.log("UserStore: Store has been hydrated. isHydrated = true.");
          } else {
            console.warn("UserStore: onRehydrateStorage called with null state, isHydrated not set.");
          }
      },

      migrate: (persistedState, version) => {
        if (version === 0) {
          const state = persistedState as any;
          if (typeof state.isAuthenticated === 'undefined') {
            state.isAuthenticated = false;
          }
          if (typeof state.currentUser === 'undefined') {
            state.currentUser = null;
          }
          if (typeof state.isHydrated === 'undefined') {
            state.isHydrated = false;
          }
          if (state.users) {
            state.users = state.users.map((user: User) => ({
              ...user,
              email: user.email || `migrated-${user.id.substring(0, 4)}@example.com`, 
              password: user.password || "password123",
              role: user.role && ['manager', 'lead_technician', 'employee', 'admin'].includes(user.role) ? user.role : 'employee', 
            }));
          }
        }
        return persistedState as UserStoreState;
      },
      version: 1,
    }
  )
);