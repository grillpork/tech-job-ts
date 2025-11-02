import { MOCK_ATTACHMENTS, MOCK_JOBS } from "@/lib/mocks/job";
import { MOCK_USERS } from "@/lib/mocks/user";
import { Attachment, Job } from "@/lib/types/job";
import { User } from "@/lib/types/user";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { format } from "date-fns"; // ✅ 1. Import 'format'

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
            
            // ✅ --- 2. ส่วนที่แก้ไข --- ✅
            // แปลง Date object เป็น String (yyyy-MM-dd) ก่อนบันทึก
            startDate: newJobData.startDate ? format(newJobData.startDate, "yyyy-MM-dd") : null,
            endDate: newJobData.endDate ? format(newJobData.endDate, "yyyy-MM-dd") : null,
            // --- สิ้นสุดการแก้ไข ---

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

          // ✅ --- 3. เพิ่ม Logic การแปลงข้อมูลสำหรับ Update --- ✅
          // (เพื่อให้ Edit ทำงานได้สมบูรณ์)

          // แปลง ID กลับเป็น Object
          if (updatedData.creatorId) {
            const creatorUser = state.jobUsers.find(u => u.id === updatedData.creatorId);
            if (creatorUser) updatedData.creator = { id: creatorUser.id, name: creatorUser.name, role: creatorUser.role };
          }
          if (updatedData.assignedEmployeeIds) {
            updatedData.assignedEmployees = state.jobUsers.filter(u => updatedData.assignedEmployeeIds.includes(u.id));
          }
          if (updatedData.leadTechnicianId) {
             updatedData.leadTechnician = state.jobUsers.find(u => u.id === updatedData.leadTechnicianId) || null;
          }
          
          // แปลง Date objects เป็น String
          if (updatedData.startDate) {
            updatedData.startDate = format(updatedData.startDate, "yyyy-MM-dd");
          }
           if (updatedData.endDate) {
            updatedData.endDate = format(updatedData.endDate, "yyyy-MM-dd");
          }

          // แปลง Tasks
          if (updatedData.tasks) {
             updatedData.tasks = updatedData.tasks.map((t: { description: string }, i: number) => ({
              id: crypto.randomUUID(),
              description: t.description,
              isCompleted: false, details: null, order: i,
            }));
          }
          
          // ลบ helper fields ที่ฟอร์มส่งมา
          delete updatedData.creatorId;
          delete updatedData.assignedEmployeeIds;
          delete updatedData.leadTechnicianId;
          
          // อัปเดตข้อมูล job ด้วย immer
          Object.assign(state.jobs[jobIndex], updatedData);
          // --- สิ้นสุดการแก้ไข ---
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