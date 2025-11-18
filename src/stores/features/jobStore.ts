// src/stores/jobStore.ts
import { MOCK_JOBS } from "@/lib/mocks/job";
import { MOCK_USERS } from "@/lib/mocks/user";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { notificationHelpers } from "@/stores/notificationStore";
import { useAuditLogStore } from "./auditLogStore";
import { useUserStore } from "./userStore";

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
  type?: "บ้าน" | "คอนโด" | null;
  priority?: "low" | "medium" | "high" | "urgent" | null;
  creator: { id: string; name: string; role: JobUser["role"] };
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
  ) => string;

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
  addWorkLog: (jobId: string, workLog: Omit<WorkLog, "id" | "createdAt">) => void;
  reorderJobs: (newOrder: Job[]) => void;
  // Completion Request functions
  requestJobCompletion: (jobId: string, requestedBy: { id: string; name: string }, signature: string) => string;
  approveCompletionRequest: (requestId: string, approvedBy: { id: string; name: string }) => void;
  rejectCompletionRequest: (requestId: string, rejectedBy: { id: string; name: string }, rejectionReason: string) => void;
  getCompletionRequestByJobId: (jobId: string) => CompletionRequest | undefined;
  getCompletionRequestStatus: (jobId: string) => "pending" | "approved" | "rejected" | null;
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
      createJob: (newJobData) => {
        const creatorUser = get().jobUsers.find(
          (u) => u.id === newJobData.creatorId
        );
        if (!creatorUser) {
          console.error("JobStore: Creator user not found for new job.");
          return crypto.randomUUID(); // Return a fallback ID
        }

        const newJobId = crypto.randomUUID();
        const assignedEmployees = get().jobUsers.filter((u) =>
          newJobData.assignedEmployeeIds?.includes(u.id)
        );
        const leadTechnician = get().jobUsers.find(
          (u) => u.id === newJobData.leadTechnicianId
        ) || null;
        
        // ✅ ตรวจสอบว่ามี leadTechnician และ assignedEmployees ครบหรือไม่
        const hasLeadTechnician = leadTechnician !== null;
        const hasAssignedEmployees = assignedEmployees.length > 0;
        const initialStatus = (hasLeadTechnician && hasAssignedEmployees) ? "in_progress" : "pending";

        const newJob: Job = {
          id: newJobId,
          title: newJobData.title,
          description: newJobData.description || null,
          status: initialStatus,
          departments: Array.isArray(newJobData.departments) ? newJobData.departments : (newJobData.departments ? [newJobData.departments] : []),
          type: newJobData.type || null,
          priority: newJobData.priority || null,
          creator: {
            id: creatorUser.id,
            name: creatorUser.name,
            role: creatorUser.role,
          },
          assignedEmployees: assignedEmployees,
          leadTechnician: leadTechnician,
          tasks:
            newJobData.tasks?.map((t, i) => ({
              id: crypto.randomUUID(),
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
            locationImages: newJobData.locationImages || [],
            beforeImages: newJobData.beforeImages || [],
            afterImages: newJobData.afterImages || [],
            attachments: newJobData.attachments || [],
            customerType: newJobData.customerType || null,
            customerName: newJobData.customerName || null,
            customerPhone: newJobData.customerPhone || null,
            customerCompanyName: newJobData.customerCompanyName || null,
            customerTaxId: newJobData.customerTaxId || null,
            customerAddress: newJobData.customerAddress || null,
            signature: newJobData.signature || null,
            workLogs: [
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                updatedBy: {
                  id: creatorUser.id,
                  name: creatorUser.name,
                },
                status: initialStatus,
                note: initialStatus === "in_progress" 
                  ? "งานถูกสร้างขึ้นและสถานะเป็น 'กำลังดำเนินการ' อัตโนมัติ เนื่องจากมีการมอบหมาย Lead Technician และ Employees ครบถ้วนแล้ว"
                  : "งานถูกสร้างขึ้น",
                createdAt: new Date().toISOString(),
              },
            ],
          };

        set((state) => {
          state.jobs.unshift(newJob);
        });
        
        // ✅ สร้าง notification เมื่อสร้าง job สำเร็จ
        notificationHelpers.jobCreated(
          newJob.title,
          newJob.creator.name,
          newJob.id
        );

        // ✅ บันทึก audit log
        try {
          useAuditLogStore.getState().addAuditLog({
            action: "create",
            entityType: "job",
            entityId: newJob.id,
            entityName: newJob.title,
            performedBy: {
              id: creatorUser.id,
              name: creatorUser.name,
              role: creatorUser.role,
            },
            details: `สร้างงานใหม่: ${newJob.title}`,
          });
        } catch (error) {
          console.error("Failed to log audit:", error);
        }
        
        return newJob.id; // ✅ Return job ID
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
      
          // --- อัปเดตข้อมูลทั่วไป ---
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
              : (updatedData.departments ? [updatedData.departments] : []);
          }
      
          const {
            creatorId,
            assignedEmployeeIds,
            leadTechnicianId,
            tasks,
            attachments,
            location,
            locationImages,
            departments,
            ...restOfUpdatedData
          } = updatedData;
      
          Object.assign(currentJob, restOfUpdatedData);
      
          // ✅ บันทึก audit log
          try {
            const currentUser = useUserStore.getState().currentUser;
            if (currentUser) {
              const changes: { field: string; oldValue: any; newValue: any }[] = [];
              
              // เก็บการเปลี่ยนแปลงที่สำคัญ
              if (updatedData.title !== undefined && updatedData.title !== currentJob.title) {
                changes.push({ field: "title", oldValue: currentJob.title, newValue: updatedData.title });
              }
              if (updatedData.status !== undefined && updatedData.status !== currentJob.status) {
                changes.push({ field: "status", oldValue: currentJob.status, newValue: updatedData.status });
              }
              
              useAuditLogStore.getState().addAuditLog({
                action: "update",
                entityType: "job",
                entityId: currentJob.id,
                entityName: currentJob.title,
                performedBy: {
                  id: currentUser.id,
                  name: currentUser.name,
                  role: currentUser.role,
                },
                details: `แก้ไขงาน: ${currentJob.title}`,
                changes: changes.length > 0 ? changes : undefined,
              });
            }
          } catch (error) {
            console.error("Failed to log audit:", error);
          }
      
          // ✅ ตรวจสอบสถานะและเปลี่ยนแบบอัตโนมัติ
          const hasLeadTechnician = currentJob.leadTechnician !== null;
          const hasAssignedEmployees = currentJob.assignedEmployees.length > 0;
      
          // --- จาก pending → in_progress
          if (hasLeadTechnician && hasAssignedEmployees && currentJob.status === "pending") {
            currentJob.status = "in_progress";
      
            if (!currentJob.workLogs) currentJob.workLogs = [];
            currentJob.workLogs.unshift({
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              updatedBy: { id: "system", name: "ระบบ" },
              status: "in_progress",
              note: "สถานะเปลี่ยนเป็น 'กำลังดำเนินการ' เพราะมี Lead และ Employee ครบ",
              createdAt: new Date().toISOString(),
            });
      
            console.log(`JobStore: Job ${jobId} → in_progress`);
          }
      
          // --- จาก in_progress → pending
          else if ((!hasLeadTechnician || !hasAssignedEmployees) && currentJob.status === "in_progress") {
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
      
            console.log(`JobStore: Job ${jobId} → pending`);
          }
        });
      },
      

      deleteJob: (jobId) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (job) {
          // ✅ บันทึก audit log ก่อนลบ
          try {
            useAuditLogStore.getState().addAuditLog({
              action: "delete",
              entityType: "job",
              entityId: job.id,
              entityName: job.title,
              performedBy: {
                id: job.creator.id,
                name: job.creator.name,
                role: job.creator.role,
              },
              details: `ลบงาน: ${job.title}`,
            });
          } catch (error) {
            console.error("Failed to log audit:", error);
          }
        }
        
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

      addWorkLog: (jobId, workLogData) => {
        set((state) => {
          const job = state.jobs.find((j) => j.id === jobId);
          if (!job) {
            console.warn(`JobStore: Job with ID ${jobId} not found for adding work log.`);
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
      requestJobCompletion: (jobId, requestedBy, signature) => {
        const job = get().jobs.find(j => j.id === jobId);
        if (!job) {
          console.error("JobStore: Job not found for completion request");
          return "";
        }

        // ตรวจสอบว่ามี request ที่ pending อยู่แล้วหรือไม่
        const existingRequest = get().completionRequests.find(
          req => req.jobId === jobId && req.status === "pending"
        );
        if (existingRequest) {
          console.warn("JobStore: Completion request already exists for this job");
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
          const jobIndex = state.jobs.findIndex(j => j.id === jobId);
          if (jobIndex !== -1) {
            state.jobs[jobIndex].status = "pending_approval";
            state.jobs[jobIndex].signature = signature;
            // ล้าง rejection reason เมื่อส่งคำขอใหม่
            state.jobs[jobIndex].rejectionReason = null;
          }
        });

        return requestId;
      },

      approveCompletionRequest: (requestId, approvedBy) => {
        set((state) => {
          const requestIndex = state.completionRequests.findIndex(req => req.id === requestId);
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
          const jobIndex = state.jobs.findIndex(j => j.id === request.jobId);
          if (jobIndex !== -1) {
            state.jobs[jobIndex].status = "completed";
          }
        });
      },

      rejectCompletionRequest: (requestId, rejectedBy, rejectionReason) => {
        set((state) => {
          const requestIndex = state.completionRequests.findIndex(req => req.id === requestId);
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
          const jobIndex = state.jobs.findIndex(j => j.id === request.jobId);
          if (jobIndex !== -1) {
            state.jobs[jobIndex].status = "rejected";
            state.jobs[jobIndex].rejectionReason = rejectionReason;
          }
        });
      },

      getCompletionRequestByJobId: (jobId) => {
        return get().completionRequests.find(req => req.jobId === jobId);
      },

      getCompletionRequestStatus: (jobId) => {
        const request = get().completionRequests.find(req => req.jobId === jobId);
        return request?.status || null;
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

        // ✅ Migration: แปลง department เดิมเป็น departments array (backward compatibility)
        if (state && (state as JobStoreState).jobs) {
          (state as JobStoreState).jobs.forEach((job: any) => {
            // ถ้ายังไม่มี departments แต่มี department ให้แปลง
            if (!job.departments && job.department) {
              job.departments = [job.department];
              delete job.department;
            }
            // ถ้าไม่มีทั้งสองอย่าง ให้ตั้งเป็น array ว่าง
            if (!job.departments) {
              job.departments = [];
            }
          });
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