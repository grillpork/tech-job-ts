import { MOCK_ATTACHMENTS, MOCK_JOBS } from "@/lib/mocks/job";
import { MOCK_USERS } from "@/lib/mocks/user";
import { Attachment, Job } from "@/lib/types/job";
import { User } from "@/lib/types/user";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface JobStoreState {
  jobs: Job[];
  jobUsers: User[];
  isHydrated: boolean;

  createJob: (newJobData: any) => void;
  updateJob: (jobId: string, updatedData: any) => void;
  deleteJob: (jobId: string) => void;
  completeJob: (jobId: string) => void;
  getJobById: (jobId: string) => Job | undefined;
  getJobUserById: (userId: string) => User | undefined;
}

export const useJobStore = create<JobStoreState>()(
  persist(
    immer((set, get) => ({
      jobs: [],
      jobUsers: [],
      isHydrated: false,

      createJob: (newJobData) => {
        set((state) => {
          const creatorUser = state.jobUsers.find(
            (u) => u.id === newJobData.creatorId
          );
          if (!creatorUser) return;

          const newJob: Job = {
            id: crypto.randomUUID(),
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
              newJobData.tasks?.map((t: { description: any; }, i: any) => ({
                id: crypto.randomUUID(),
                description: t.description,
                isCompleted: false,
                details: null,
                order: i,
              })) || [],
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
          if (jobIndex === -1) return;
          Object.assign(state.jobs[jobIndex], updatedData);
        });
      },

      deleteJob: (jobId) => {
        set((state) => {
          state.jobs = state.jobs.filter((job) => job.id !== jobId);
        });
      },

      completeJob: (jobId) => {
        set((state) => {
          const job = state.jobs.find((j) => j.id === jobId);
          if (job) job.status = "completed";
        });
      },

      getJobById: (jobId) => get().jobs.find((job) => job.id === jobId),
      getJobUserById: (userId) => get().jobUsers.find((u) => u.id === userId),
    })),
    {
      name: "job-management-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          ((state as JobStoreState).jobUsers.length === 0 ||
            (state as JobStoreState).jobs.length === 0)
        ) {
          (state as JobStoreState).jobUsers = MOCK_USERS;
          (state as JobStoreState).jobs = MOCK_JOBS;
        }
        if (state) (state as JobStoreState).isHydrated = true;
      },
      version: 1,
    }
  )
);
