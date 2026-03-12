// src/stores/jobStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { notificationHelpers } from "@/stores/notificationStore";


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

export interface WorkLog {
  id: string;
  date: string;
  updatedBy: { id: string; name: string };
  status: Job["status"];
  note: string;
  createdAt: string;
}

export interface Job {
  department?: string;
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
  departments: string[]; // เปลี่ยนเป็น array สำหรับหลาย departments
  type?: "บ้าน" | "คอนโด" | "อาคาร" | null;
  priority?: "low" | "medium" | "high" | "urgent" | null;
  creator: { id: string; name: string; role: JobUser["role"] };
  creatorName?: string;
  assignedEmployees: JobUser[];
  leadTechnician: JobUser | null;
  tasks: Task[];
  usedInventory?: { id: string; qty: number }[];
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: { lat: number; lng: number; name?: string | null } | null;
  locationImages?: string[]; // รูปภาพสถานที่ (หลายรูป)
  attachments: Attachment[];
  beforeImages?: string[]; // รูปภาพก่อนซ่อม
  afterImages?: string[]; // รูปภาพหลังซ่อม
  workLogs?: WorkLog[];
  customerType?: "individual" | "organization" | null; // ประเภทลูกค้า: ปกติ หรือ องค์กร
  customerName?: string | null; // ชื่อลูกค้าปกติ หรือ ชื่อผู้ติดต่อ (สำหรับองค์กร)
  customerPhone?: string | null;
  // ข้อมูลลูกค้าองค์กร
  customerCompanyName?: string | null; // ชื่อบริษัท/องค์กร
  customerTaxId?: string | null; // เลขประจำตัวผู้เสียภาษี
  customerAddress?: string | null; // ที่อยู่บริษัท
  signature?: string | null;
  rejectionReason?: string | null; // เหตุผลการ reject จาก lead_technician
}

export interface CompletionRequest {
  id: string;
  jobId: string;
  requestedBy: { id: string; name: string };
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: { id: string; name: string } | null;
  approvedAt?: string | null;
  rejectedBy?: { id: string; name: string } | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

// --- 2. Store State & Actions Interface ---
// (เหมือนเดิม)
interface JobStoreState {
  jobs: Job[];
  jobUsers: JobUser[];
  completionRequests: CompletionRequest[];
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
      attachments?: Attachment[];
    }
  ) => Promise<string | null>;

  updateJob: (
    jobId: string,
    updatedData: Partial<
      Omit<
        Job,
        | "creator"
        | "assignedEmployees"
        | "leadTechnician"
        | "tasks"
        | "attachments"
      > & {
        creatorId?: string;
        usedInventory?: { id: string; qty: number }[];
        assignedEmployeeIds?: string[];
        leadTechnicianId?: string | null;
        tasks?: {
          id?: string;
          description: string;
          details?: string | null;
          isCompleted?: boolean;
          order?: number;
        }[];
        attachments?: Attachment[];
      }
    >
  ) => Promise<void>;

  deleteJob: (jobId: string) => Promise<void>;
  getJobById: (jobId: string) => Job | undefined;
  getJobUserById: (userId: string) => JobUser | undefined;
  addWorkLog: (
    jobId: string,
    workLog: Omit<WorkLog, "id" | "createdAt">
  ) => void;
  reorderJobs: (newOrder: Job[]) => void;
  // Completion Request functions
  requestJobCompletion: (
    jobId: string,
    requestedBy: { id: string; name: string },
    signature: string,
    beforeImages?: string[],
    afterImages?: string[]
  ) => string;
  approveCompletionRequest: (
    requestId: string,
    approvedBy: { id: string; name: string }
  ) => void;
  rejectCompletionRequest: (
    requestId: string,
    rejectedBy: { id: string; name: string },
    rejectionReason: string
  ) => void;
  getCompletionRequestByJobId: (jobId: string) => CompletionRequest | undefined;
  getCompletionRequestStatus: (
    jobId: string
  ) => "pending" | "approved" | "rejected" | null;
  fetchJobs: () => Promise<void>;
}

// --- 4. Create Zustand Store ---
export const useJobStore = create<JobStoreState>()(
  persist(
    immer((set, get) => ({
      // --- Initial State ---
      jobs: [],
      jobUsers: [],
      completionRequests: [],
      isHydrated: false,

      // --- Job Actions Implementations ---
      // --- Job Actions Implementations ---
      createJob: async (newJobData) => {
        try {
          const response = await fetch('/api/jobs', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(newJobData)
          });

          if (!response.ok) {
             console.error("JobStore: Failed to create job API");
             return null;
          }
          
          const newJob = await response.json();

          set((state) => {
            state.jobs.unshift(newJob);
          });

          // ✅ สร้าง notification เมื่อสร้าง job สำเร็จ
          notificationHelpers.jobCreated(
            newJob.title,
            newJob.creator.name,
            newJob.id
          );
          
          return newJob.id;
        } catch (error) {
           console.error("JobStore: Error creating job", error);
           return null;
        }
      },

      updateJob: async (jobId, updatedData) => {
         // Optimistic Update First then Sync
        set((state) => {
          const jobIndex = state.jobs.findIndex((job) => job.id === jobId);
          if (jobIndex === -1) return;

          const currentJob = state.jobs[jobIndex];
          const availableJobUsers = get().jobUsers;

          // --- อัปเดตข้อมูลทั่วไป ---
          if (updatedData.creatorId !== undefined) {
            const newCreator = availableJobUsers.find(
              (u) => u.id === updatedData.creatorId
            );
            if (newCreator) {
              currentJob.creator = {
                id: newCreator.id,
                name: newCreator.name,
                role: newCreator.role,
              };
              currentJob.creatorName = newCreator.name;
            }
          }

          if (updatedData.assignedEmployeeIds !== undefined) {
            currentJob.assignedEmployees = availableJobUsers.filter((u) =>
              updatedData.assignedEmployeeIds?.includes(u.id)
            );
          }

          if (updatedData.leadTechnicianId !== undefined) {
             if (updatedData.leadTechnicianId === null) {
                currentJob.leadTechnician = null;
             } else {
                currentJob.leadTechnician =
                availableJobUsers.find(
                    (u) => u.id === updatedData.leadTechnicianId
                ) || null;
             }
          }

          if (updatedData.tasks !== undefined) {
            currentJob.tasks = updatedData.tasks.map((t, i) => ({
              id: t.id || crypto.randomUUID(),
              description: t.description,
              details: t.details !== undefined ? t.details : null,
              isCompleted: t.isCompleted !== undefined ? t.isCompleted : false,
              order: t.order !== undefined ? t.order : i,
            }));
          }

          if (updatedData.usedInventory !== undefined) {
            currentJob.usedInventory = updatedData.usedInventory;
          }

          if (updatedData.attachments !== undefined) {
            currentJob.attachments = updatedData.attachments;
          }

          if (updatedData.locationImages !== undefined) {
            currentJob.locationImages = updatedData.locationImages;
          }

          if (updatedData.location !== undefined) {
            currentJob.location = updatedData.location;
          }

          // จัดการ departments
          if (updatedData.departments !== undefined) {
            currentJob.departments = Array.isArray(updatedData.departments)
              ? updatedData.departments
              : updatedData.departments
              ? [updatedData.departments]
              : [];
          }

          const {
            creatorId: _creatorId, // eslint-disable-line @typescript-eslint/no-unused-vars
            assignedEmployeeIds: _assignedEmployeeIds, // eslint-disable-line @typescript-eslint/no-unused-vars
            leadTechnicianId: _leadTechnicianId, // eslint-disable-line @typescript-eslint/no-unused-vars
            tasks: _tasks, // eslint-disable-line @typescript-eslint/no-unused-vars
            attachments: _attachments, // eslint-disable-line @typescript-eslint/no-unused-vars
            location: _location, // eslint-disable-line @typescript-eslint/no-unused-vars
            locationImages: _locationImages, // eslint-disable-line @typescript-eslint/no-unused-vars
            departments: _departments, // eslint-disable-line @typescript-eslint/no-unused-vars
            ...restOfUpdatedData
          } = updatedData;

          Object.assign(currentJob, restOfUpdatedData);

          // ✅ ตรวจสอบสถานะและเปลี่ยนแบบอัตโนมัติ
          const hasLeadTechnician = currentJob.leadTechnician !== null;
          const hasAssignedEmployees = currentJob.assignedEmployees.length > 0;

          // --- จาก pending → in_progress
          if (
            hasLeadTechnician &&
            hasAssignedEmployees &&
            currentJob.status === "pending"
          ) {
            currentJob.status = "in_progress";
             // Note: Logs handled by store or should be separated. 
             // Ideally API handles logs. Skipping log creation here to let API handle it or keep it local?
             // Keeping it consistent with previous logic:
            if (!currentJob.workLogs) currentJob.workLogs = [];
            currentJob.workLogs.unshift({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                updatedBy: { id: "system", name: "ระบบ" },
                status: "in_progress",
                note: "สถานะเปลี่ยนเป็น 'กำลังดำเนินการ' เพราะมี Lead และ Employee ครบ",
                createdAt: new Date().toISOString(),
            });
          }
          // --- จาก in_progress → pending
          else if (
            (!hasLeadTechnician || !hasAssignedEmployees) &&
            currentJob.status === "in_progress"
          ) {
            currentJob.status = "pending";
             if (!currentJob.workLogs) currentJob.workLogs = [];
             currentJob.workLogs.unshift({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                updatedBy: { id: "system", name: "ระบบ" },
                status: "pending",
                note: "สถานะกลับเป็น 'รอดำเนินการ' เพราะ Lead หรือ Employee ถูกลบออก",
                createdAt: new Date().toISOString(),
             });
          }
        });

        // Sync with API
        try {
            // Retrieve latest state to send correct final data
            const job = get().jobs.find((j) => j.id === jobId);
            if (!job) return;

            // Prepare payload matching API expectations
            const payload = {
                ...updatedData,
                status: job.status, // Include potentially auto-updated status
                // If tasks/relational fields were updated, we need to send them as well
                // The API PUT expects the full new structure for some lists or defined IDs
                
                // Specific fields that might have changed but aren't in 'updatedData' directly if auto-logic touched them
            };
            
            // To be safe and since API PUT is flexible, we can send what we have in updatedData + status
            // Note: assignedEmployeeIds etc are in updatedData
            
            await fetch(`/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
        } catch (error) {
            console.error("JobStore: Failed to update job API", error);
            // Revert invalid? (Not implementing complex revert for now)
        }
      },

      deleteJob: async (jobId) => {
         try {
            await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
            set((state) => {
                state.jobs = state.jobs.filter((job) => job.id !== jobId);
            });
         } catch (error) {
             console.error("JobStore: Failed to delete job", error);
         }
      },

      getJobById: (jobId: string) => {
        return get().jobs.find((job) => job.id === jobId);
      },

      getJobUserById: (userId: string) => {
        return get().jobUsers.find((user) => user.id === userId);
      },

      addWorkLog: (jobId, workLogData) => {
        set((state) => {
          const job = state.jobs.find((j) => j.id === jobId);
          if (!job) {
            console.warn(
              `JobStore: Job with ID ${jobId} not found for adding work log.`
            );
            return;
          }
          if (!job.workLogs) {
            job.workLogs = [];
          }
          const newWorkLog: WorkLog = {
            id: crypto.randomUUID(),
            ...workLogData,
            createdAt: new Date().toISOString(),
          };
          job.workLogs.unshift(newWorkLog);
        });
      },

      reorderJobs: (newOrder) => {
        set((state) => {
          // สร้าง map ของ job IDs เพื่อตรวจสอบว่า job ทั้งหมดยังคงอยู่
          const newOrderIds = new Set(newOrder.map((job) => job.id));
          const existingIds = new Set(state.jobs.map((job) => job.id));

          // ตรวจสอบว่า job IDs ตรงกันหรือไม่
          if (newOrderIds.size !== existingIds.size) {
            console.warn("JobStore: Cannot reorder - job count mismatch");
            return;
          }

          // ตรวจสอบว่า job IDs ทั้งหมดตรงกัน
          for (const id of newOrderIds) {
            if (!existingIds.has(id)) {
              console.warn(`JobStore: Cannot reorder - job ${id} not found`);
              return;
            }
          }

          // อัปเดตลำดับตาม newOrder
          state.jobs = newOrder;
        });
      },

      // Completion Request functions
      requestJobCompletion: (
        jobId,
        requestedBy,
        signature,
        beforeImages = [],
        afterImages = []
      ) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) {
          console.error("JobStore: Job not found for completion request");
          return "";
        }

        // ตรวจสอบว่ามี request ที่ pending อยู่แล้วหรือไม่
        const existingRequest = get().completionRequests.find(
          (req) => req.jobId === jobId && req.status === "pending"
        );
        if (existingRequest) {
          console.warn(
            "JobStore: Completion request already exists for this job"
          );
          return existingRequest.id;
        }

        const requestId = crypto.randomUUID();
        const newRequest: CompletionRequest = {
          id: requestId,
          jobId,
          requestedBy,
          requestedAt: new Date().toISOString(),
          status: "pending",
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
        };

        set((state) => {
          state.completionRequests.push(newRequest);
          // เปลี่ยน job status เป็น pending_approval
          const jobIndex = state.jobs.findIndex((j) => j.id === jobId);
          if (jobIndex !== -1) {
            state.jobs[jobIndex].status = "pending_approval";
            state.jobs[jobIndex].signature = signature;
            // อัปเดตรูปภาพ before/after
            if (beforeImages.length > 0) {
              state.jobs[jobIndex].beforeImages = beforeImages;
            }
            if (afterImages.length > 0) {
              state.jobs[jobIndex].afterImages = afterImages;
            }
            // ล้าง rejection reason เมื่อส่งคำขอใหม่
            state.jobs[jobIndex].rejectionReason = null;
          }
        });

        return requestId;
      },

      approveCompletionRequest: (requestId, approvedBy) => {
        set((state) => {
          const requestIndex = state.completionRequests.findIndex(
            (req) => req.id === requestId
          );
          if (requestIndex === -1) {
            console.warn("JobStore: Completion request not found");
            return;
          }

          const request = state.completionRequests[requestIndex];
          request.status = "approved";
          request.approvedBy = approvedBy;
          request.approvedAt = new Date().toISOString();
          request.rejectedBy = null;
          request.rejectedAt = null;
          request.rejectionReason = null;

          // เปลี่ยน job status เป็น completed
          const jobIndex = state.jobs.findIndex((j) => j.id === request.jobId);
          if (jobIndex !== -1) {
            state.jobs[jobIndex].status = "completed";
          }
        });
      },

      rejectCompletionRequest: (requestId, rejectedBy, rejectionReason) => {
        set((state) => {
          const requestIndex = state.completionRequests.findIndex(
            (req) => req.id === requestId
          );
          if (requestIndex === -1) {
            console.warn("JobStore: Completion request not found");
            return;
          }

          const request = state.completionRequests[requestIndex];
          request.status = "rejected";
          request.rejectedBy = rejectedBy;
          request.rejectedAt = new Date().toISOString();
          request.rejectionReason = rejectionReason;
          request.approvedBy = null;
          request.approvedAt = null;

          // เปลี่ยน job status เป็น rejected และเก็บ rejection reason
          const jobIndex = state.jobs.findIndex((j) => j.id === request.jobId);
          if (jobIndex !== -1) {
            state.jobs[jobIndex].status = "rejected";
            state.jobs[jobIndex].rejectionReason = rejectionReason;
          }
        });
      },

      getCompletionRequestByJobId: (jobId) => {
        return get().completionRequests.find((req) => req.jobId === jobId);
      },

      getCompletionRequestStatus: (jobId) => {
        const request = get().completionRequests.find(
          (req) => req.jobId === jobId
        );
        return request?.status || null;
      },

      fetchJobs: async () => {
        try {
          const [jobsRes, usersRes] = await Promise.all([
            fetch('/api/jobs'),
            fetch('/api/users')
          ]);

          if (jobsRes.ok) {
            const jobs = await jobsRes.json();
            set({ jobs });
          }
          if (usersRes.ok) {
            const users = await usersRes.json();
            set({ jobUsers: users });
          }
          console.log("✅ JobStore: Fetched jobs and users from API.");
        } catch (error) {
          console.error("❌ JobStore: Failed to fetch data", error);
        }
      },
    })),
    {
      name: "job-management-storage",
      storage: createJSONStorage(() => localStorage),

      // ✅ อัปเดต onRehydrateStorage ให้ใช้ MOCK DATA
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          // Trigger fetch
          state.fetchJobs();
          console.log("✅ JobStore: Hydrated and fetch triggered.");
        }
      },

      // (ส่วน migrate เหมือนเดิม)
      migrate: (persistedState, version) => {
        if (version < 1) {
          const state = persistedState as JobStoreState & { isAuthenticated?: boolean; currentUser?: unknown; users?: unknown };
          if (typeof state.isHydrated === "undefined") {
            state.isHydrated = false;
          }
          if (typeof state.jobUsers === "undefined") {
            state.jobUsers = [];
          }
          // Cleanup old keys if they exist in the type intersection
          /* eslint-disable @typescript-eslint/no-unused-expressions */
          state.isAuthenticated;
          state.currentUser;
          state.users;
          /* eslint-enable @typescript-eslint/no-unused-expressions */
        }
        return persistedState as JobStoreState;
      },
      version: 1,
    }
  )
);
