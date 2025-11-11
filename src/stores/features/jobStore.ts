// src/stores/jobStore.ts
import { MOCK_JOBS } from "@/lib/mocks/job";
import { MOCK_USERS } from "@/lib/mocks/user";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface JobUser {
  id: string;
  name: string;
  imageUrl?: string | null;
  role: "admin" | "manager" | "lead_technician" | "employee";
  email?: string;
  password?: string;
}

export interface Task {
  id: string;
  description: string;
  details: string | null;
  isCompleted: boolean;
  order: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  status:
    | "pending"
    | "in_progress"
    | "pending_approval"
    | "completed"
    | "cancelled"
    | "rejected";
  department: string | null;
  creator: { id: string; name: string; role: JobUser["role"] };
  assignedEmployees: JobUser[];
  leadTechnician: JobUser | null;
  tasks: Task[];
  usedInventory?: { id: string; qty: number }[];
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: { lat: number; lng: number; name?: string | null } | null;
  attachments: Attachment[];
}

// --- 2. Store State & Actions Interface ---
// (เหมือนเดิม)
interface JobStoreState {
  jobs: Job[];
  jobUsers: JobUser[];
  isHydrated: boolean;

  createJob: (
    newJobData: Omit<
      Job,
      | "id"
      | "createdAt"
      | "creator"
      | "assignedEmployees"
      | "leadTechnician"
      | "tasks"
      | "attachments"
    > & {
      creatorId: string;
      usedInventory?: { id: string; qty: number }[];
      assignedEmployeeIds?: string[];
      leadTechnicianId?: string | null;
      tasks?: { description: string }[];
    }
  ) => void;

  updateJob: (
    jobId: string,
    updatedData: Partial<
      Omit<Job, "creator" | "assignedEmployees" | "leadTechnician" | "tasks" | "attachments"> & {
        creatorId?: string;
        usedInventory?: { id: string; qty: number }[];
        assignedEmployeeIds?: string[];
        leadTechnicianId?: string | null;
        tasks?: { id?: string; description: string; details?: string | null; isCompleted?: boolean; order?: number }[];
        attachments?: Attachment[];
      }
    >
  ) => void;

  deleteJob: (jobId: string) => void;
  getJobById: (jobId: string) => Job | undefined;
  getJobUserById: (userId: string) => JobUser | undefined;
}



// --- 4. Create Zustand Store ---
export const useJobStore = create<JobStoreState>()(
  persist(
    immer((set, get) => ({
      // --- Initial State ---
      jobs: [],
      jobUsers: [],
      isHydrated: false,

      // --- Job Actions Implementations ---
      createJob: (newJobData) => {
        set((state) => {
          const creatorUser = state.jobUsers.find(
            (u) => u.id === newJobData.creatorId
          );
          if (!creatorUser) {
            console.error("JobStore: Creator user not found for new job.");
            return;
          }

          const newJob: Job = {
            id: crypto.randomUUID(), // ✅ ใช้ API มาตรฐานของเบราว์เซอร์
            title: newJobData.title,
            description: newJobData.description || null,
            status: "pending",
            department: newJobData.department || null,
            creator: {
              id: creatorUser.id,
              name: creatorUser.name,
              role: creatorUser.role,
            },
            assignedEmployees: state.jobUsers.filter((u) =>
              newJobData.assignedEmployeeIds?.includes(u.id)
            ),
            leadTechnician:
              state.jobUsers.find(
                (u) => u.id === newJobData.leadTechnicianId
              ) || null,
            tasks:
              newJobData.tasks?.map((t, i) => ({
                id: crypto.randomUUID(), // ✅ ใช้ API มาตรฐานของเบราว์เซอร์
                description: t.description,
                isCompleted: false,
                details: null,
                order: i,
              })) || [],
            usedInventory: newJobData.usedInventory || [],
            createdAt: new Date().toISOString(),
            startDate: newJobData.startDate || null,
            endDate: newJobData.endDate || null,
            location: newJobData.location || null,
            attachments: [],
          };
          state.jobs.unshift(newJob);
        });
      },

      updateJob: (jobId, updatedData) => {
        set((state) => {
          const jobIndex = state.jobs.findIndex((job) => job.id === jobId);
          if (jobIndex === -1) {
            console.warn(`JobStore: Job with ID ${jobId} not found for update.`);
            return;
          }

          const currentJob = state.jobs[jobIndex];
          const availableJobUsers = get().jobUsers;

          if (updatedData.creatorId !== undefined) {
            const newCreator = availableJobUsers.find(
              (u) => u.id === updatedData.creatorId
            );
            currentJob.creator = newCreator
              ? {
                  id: newCreator.id,
                  name: newCreator.name,
                  role: newCreator.role,
                }
              : currentJob.creator;
          }
          if (updatedData.assignedEmployeeIds !== undefined) {
            currentJob.assignedEmployees = availableJobUsers.filter((u) =>
              updatedData.assignedEmployeeIds?.includes(u.id)
            );
          }
          if (updatedData.leadTechnicianId !== undefined) {
            currentJob.leadTechnician =
              availableJobUsers.find(
                (u) => u.id === updatedData.leadTechnicianId
              ) || null;
          }

          if (updatedData.tasks !== undefined) {
            currentJob.tasks = updatedData.tasks.map((t, i) => ({
              id: t.id || crypto.randomUUID(), // ✅ ใช้ API มาตรฐานของเบราว์เซอร์
              description: t.description,
              details: t.details !== undefined ? t.details : null,
              isCompleted:
                t.isCompleted !== undefined ? t.isCompleted : false,
              order: t.order !== undefined ? t.order : i,
            }));
          }

          if (updatedData.usedInventory !== undefined) {
            currentJob.usedInventory = updatedData.usedInventory;
          }

          if (updatedData.attachments !== undefined) {
            currentJob.attachments = updatedData.attachments;
          }

          if (updatedData.location !== undefined) {
            currentJob.location = updatedData.location;
          }

          const {
            creatorId,
            assignedEmployeeIds,
            leadTechnicianId,
            tasks,
            attachments,
            location,
            ...restOfUpdatedData
          } = updatedData;

          Object.assign(currentJob, restOfUpdatedData);
        });
      },

      deleteJob: (jobId) => {
        set((state) => {
          state.jobs = state.jobs.filter((job) => job.id !== jobId);
        });
      },

      getJobById: (jobId: string) => {
        return get().jobs.find((job) => job.id === jobId);
      },

      getJobUserById: (userId: string) => {
        return get().jobUsers.find((user) => user.id === userId);
      },
    })),
    {
      name: "job-management-storage",
      storage: createJSONStorage(() => localStorage),

      // ✅ อัปเดต onRehydrateStorage ให้ใช้ MOCK DATA
      onRehydrateStorage: () => (state) => {
        // หากยังไม่มี jobUsers หรือ jobs ให้ใช้ mock data ที่เตรียมไว้
        if (
          state &&
          ((state as JobStoreState).jobUsers.length === 0 ||
            (state as JobStoreState).jobs.length === 0)
        ) {
          console.log("JobStore: Initializing manual mock data...");

          // ✅ ใช้ข้อมูลจากตัวแปร MOCK ที่สร้างเองโดยตรง
          (state as JobStoreState).jobUsers = MOCK_USERS;
          (state as JobStoreState).jobs = MOCK_JOBS;
        } else {
          console.log(
            "JobStore: Job users and jobs already exist in store or rehydrated."
          );
        }

        if (state) {
          (state as JobStoreState).isHydrated = true;
          console.log("JobStore: Store has been hydrated. isHydrated = true.");
        } else {
          console.warn(
            "JobStore: onRehydrateStorage called with null state, isHydrated not set."
          );
        }
      },

      // (ส่วน migrate เหมือนเดิม)
      migrate: (persistedState, version) => {
        if (version < 1) {
          const state = persistedState as any;
          if (typeof state.isHydrated === "undefined") {
            state.isHydrated = false;
          }
          if (typeof state.jobUsers === "undefined") {
            state.jobUsers = [];
          }
          delete state.isAuthenticated;
          delete state.currentUser;
          delete state.users;
        }
        return persistedState as JobStoreState;
      },
      version: 1,
    }
  )
);