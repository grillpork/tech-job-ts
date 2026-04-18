"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { notificationHelpers } from "@/stores/notificationStore";
import { useUIStore } from "@/stores/uiStore";

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
  status: string;
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
  departments: string[]; 
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
  locationImages?: string[]; 
  attachments: Attachment[];
  beforeImages?: string[]; 
  afterImages?: string[]; 
  workLogs?: WorkLog[];
  customerType?: "individual" | "organization" | null; 
  customerName?: string | null; 
  customerPhone?: string | null;
  customerCompanyName?: string | null; 
  customerTaxId?: string | null; 
  customerAddress?: string | null; 
  signature?: string | null;
  rejectionReason?: string | null; 
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

interface JobStoreState {
  jobs: Job[];
  jobUsers: JobUser[];
  completionRequests: CompletionRequest[];
  isHydrated: boolean;

  createJob: (newJobData: any) => Promise<string | null>;
  updateJob: (jobId: string, updatedData: any) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  getJobById: (jobId: string) => Job | undefined;
  getJobUserById: (userId: string) => JobUser | undefined;
  reorderJobs: (newOrder: Job[]) => void;
  requestJobCompletion: (jobId: string, processor: { id: string; name: string }, signature: string, beforeImages: string[], afterImages: string[]) => Promise<boolean>;
  approveCompletionRequest: (requestId: string, processor?: { id: string; name: string }) => Promise<void>;
  rejectCompletionRequest: (requestId: string, processor: { id: string; name: string }, rejectionReason: string) => Promise<void>;
  getCompletionRequestByJobId: (jobId: string) => CompletionRequest | undefined;
  getCompletionRequestStatus: (jobId: string) => "pending" | "approved" | "rejected" | null;
  fetchJobs: () => Promise<void>;
}

export const useJobStore = create<JobStoreState>()(
  persist(
    immer((set, get) => ({
      jobs: [],
      jobUsers: [],
      completionRequests: [],
      isHydrated: false,

      createJob: async (newJobData) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch('/api/jobs', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(newJobData)
          });

          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => { state.jobs.unshift(result.data); });
            notificationHelpers.jobCreated(result.data.title, result.data.creator.name, result.data.id);
            addToast(result.message || "สร้างใบงานสำเร็จ", "success");
            return result.data.id;
          }
          addToast(result.message || "ไม่สามารถสร้างใบงานได้", "error");
          return null;
        } catch (error) {
           console.error("JobStore: Error creating job", error);
           return null;
        }
      },

      updateJob: async (jobId, updatedData) => {
        const { addToast } = useUIStore.getState();
        try {
            const res = await fetch(`/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            const result = await res.json();
            if (res.ok && result.success) {
              set((state) => {
                const idx = state.jobs.findIndex(j => j.id === jobId);
                if (idx !== -1) state.jobs[idx] = result.data;
              });
              addToast(result.message || "บันทึกการแก้ไขสำเร็จ", "success");
            } else {
              addToast(result.message || "ไม่สามารถบันทึกการแก้ไขได้", "error");
            }
        } catch (error) {
            console.error("JobStore: Failed to update job API", error);
        }
      },

      deleteJob: async (jobId) => {
         const { addToast } = useUIStore.getState();
         try {
            const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok && result.success) {
                set((state) => { state.jobs = state.jobs.filter((job) => job.id !== jobId); });
                addToast(result.message || "ลบใบงานเรียบร้อยแล้ว", "success");
            } else {
                addToast(result.message || "ไม่สามารถลบใบงานได้", "error");
            }
         } catch (error) {
             console.error("JobStore: Failed to delete job", error);
         }
      },

      getJobById: (jobId) => get().jobs.find((job) => job.id === jobId),
      getJobUserById: (userId) => get().jobUsers.find((user) => user.id === userId),

      reorderJobs: (newOrder) => {
        set((state) => { state.jobs = newOrder; });
      },

      requestJobCompletion: async (jobId, processor, signature, beforeImages, afterImages) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch('/api/jobs/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, signature, beforeImages, afterImages })
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => {
              const existingIdx = state.completionRequests.findIndex(r => r.jobId === jobId);
              if (existingIdx !== -1) state.completionRequests[existingIdx] = result.data;
              else state.completionRequests.push(result.data);

              const jobIdx = state.jobs.findIndex(j => j.id === jobId);
              if (jobIdx !== -1) state.jobs[jobIdx].status = "pending_approval";
            });
            addToast(result.message || "ส่งคำขอปิดงานสำเร็จ", "success");
            return true;
          }
          addToast(result.message || "ไม่สามารถส่งคำขอได้", "error");
          return false;
        } catch (err) {
          console.error(err);
          return false;
        }
      },

      approveCompletionRequest: async (requestId, processor) => {
        const { addToast } = useUIStore.getState();
        const request = get().completionRequests.find(r => r.id === requestId);
        if (!request) return;

        try {
          const res = await fetch(`/api/jobs/completion/${request.jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => {
              const reqIdx = state.completionRequests.findIndex(r => r.id === requestId);
              if (reqIdx !== -1) state.completionRequests[reqIdx] = result.data;
              const jobIdx = state.jobs.findIndex(j => j.id === result.data.jobId);
              if (jobIdx !== -1) state.jobs[jobIdx].status = "completed";
            });
            addToast(result.message || "อนุมัติปิดงานสำเร็จ", "success");
          } else {
            addToast(result.message || "การอนุมัติล้มเหลว", "error");
          }
        } catch (error) { console.error(error); }
      },

      rejectCompletionRequest: async (requestId, processor, rejectionReason) => {
        const { addToast } = useUIStore.getState();
        const request = get().completionRequests.find(r => r.id === requestId);
        if (!request) return;

        try {
          const res = await fetch(`/api/jobs/completion/${request.jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', rejectionReason })
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => {
              const reqIdx = state.completionRequests.findIndex(r => r.id === requestId);
              if (reqIdx !== -1) state.completionRequests[reqIdx] = result.data;
              const jobIdx = state.jobs.findIndex(j => j.id === result.data.jobId);
              if (jobIdx !== -1) {
                state.jobs[jobIdx].status = "rejected";
                state.jobs[jobIdx].rejectionReason = rejectionReason;
              }
            });
            addToast(result.message || "ปฏิเสธคำขอปิดงานแล้ว", "warning");
          }
        } catch (error) { console.error(error); }
      },

      getCompletionRequestByJobId: (jobId) => get().completionRequests.find((req) => req.jobId === jobId),

      getCompletionRequestStatus: (jobId) => {
        const request = get().completionRequests.find((req) => req.jobId === jobId);
        return request?.status || null;
      },

      fetchJobs: async () => {
        try {
          const [jobsRes, usersRes, compRes] = await Promise.all([
            fetch('/api/jobs'),
            fetch('/api/users'),
            fetch('/api/jobs/completion')
          ]);

          const jobsResult = await jobsRes.json();
          const usersResult = await usersRes.json();
          const compResult = await compRes.json();

          if (jobsRes.ok && jobsResult.success) set({ jobs: jobsResult.data });
          if (usersRes.ok && usersResult.success) set({ jobUsers: usersResult.data });
          if (compRes.ok && compResult.success) set({ completionRequests: compResult.data });
          
          console.log("✅ JobStore: Fetched jobs, users, and completions from API.");
        } catch (error) {
          console.error("❌ JobStore: Failed to fetch data", error);
        }
      },
    })),
    {
      name: "job-management-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          state.fetchJobs();
        }
      },
      version: 1,
    }
  )
);
