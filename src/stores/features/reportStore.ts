"use client";

import { create } from "zustand";

export type ReportStatus = "open" | "in_progress" | "resolved" | "closed";
export type ReportType = "bug" | "request" | "incident" | "improvement";

export interface Report {
  id: string;
  title: string;
  description?: string | null;
  type: ReportType;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string | null;
  reporter: { 
    id: string; 
    name: string; 
    imageUrl?: string | null;
    department?: string | null; // เพิ่ม department จาก reporter
  };
  assignee?: { id: string; name: string; imageUrl?: string | null } | null;
  relatedJobId?: string | null;
  relatedInventoryId?: string | null;
  attachments?: {
    id: string;
    fileName: string;
    url: string;
    uploadedAt: string;
  }[];
  tags?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  // --- New multi-department fields ---
  departments?: string[];     // แผนกทั้งหมดที่เกี่ยวข้อง
  isMultiDept?: boolean;      // มีหลายแผนกหรือไม่
  resolutionNote?: string | null; // รายละเอียดการแก้ไข
  resolvedDepts?: string[];   // แผนกที่แก้ไขเสร็จแล้ว
  forwardedTo?: string[];     // แผนกที่ส่งต่อไป
  forwardNote?: string | null;    // หมายเหตุการส่งต่อ
}

interface ReportStore {
  reports: Report[];
  isHydrated: boolean;
  isLoading: boolean;

  fetchReports: (department?: string) => Promise<void>;
  addReport: (report: Omit<Report, "id" | "createdAt">) => Promise<Report | null>;
  updateReport: (id: string, data: Partial<Report>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  clearAll: () => void;
  getReportById: (id: string) => Report | undefined;
  // Lead actions
  markInProgress: (id: string) => Promise<void>;
  resolveReport: (id: string, resolutionNote: string, dept: string) => Promise<void>;
  forwardReport: (id: string, forwardedTo: string[], forwardNote: string) => Promise<void>;
}

export const useReportStore = create<ReportStore>()((set, get) => ({
  reports: [],
  isHydrated: false,
  isLoading: false,

  fetchReports: async (department?: string) => {
    set({ isLoading: true, reports: [] });
    try {
      const url = department 
        ? `/api/reports?department=${encodeURIComponent(department)}` 
        : "/api/reports";
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      const reports = Array.isArray(data) ? data : (data.data ?? []);
      set({ reports, isLoading: false, isHydrated: true });
      console.log("✅ ReportStore: Fetched", reports.length, "reports.");
    } catch (error) {
      console.error("❌ ReportStore: Failed to fetch reports:", error);
      set({ isLoading: false, isHydrated: true });
    }
  },

  addReport: async (reportData) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportData,
          reporterId: reportData.reporter.id,
          assigneeId: reportData.assignee?.id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create report");
      }

      const newReport: Report = await res.json();
      set((state) => ({ reports: [newReport, ...state.reports] }));
      return newReport;
    } catch (error: any) {
      console.error("❌ ReportStore: addReport failed", error.message);
      return null;
    }
  },

  updateReport: async (id, data) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update report");
      }

      const updated: Report = await res.json();
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (error: any) {
      console.error("❌ ReportStore: updateReport failed", error.message);
      throw error;
    }
  },

  // Lead: เปลี่ยน status เป็น in_progress
  markInProgress: async (id: string) => {
    await get().updateReport(id, {
      status: "in_progress",
      updatedAt: new Date().toISOString(),
    });
  },

  // Lead: แก้ไขเสร็จพร้อม resolutionNote และบันทึกว่า dept ไหนแก้แล้ว
  resolveReport: async (id: string, resolutionNote: string, dept: string) => {
    const report = get().getReportById(id);
    if (!report) return;

    const currentResolved: string[] = report.resolvedDepts || [];
    const newResolved = currentResolved.includes(dept)
      ? currentResolved
      : [...currentResolved, dept];

    const allDepts: string[] = report.departments || report.tags || [];
    const isFullyResolved = allDepts.length === 0 || 
      allDepts.every(d => newResolved.includes(d));

    await get().updateReport(id, {
      status: isFullyResolved ? "resolved" : "in_progress",
      resolutionNote,
      resolvedDepts: newResolved,
      updatedAt: new Date().toISOString(),
    });
  },

  // Lead: ส่งต่อให้แผนกอื่น
  forwardReport: async (id: string, forwardedTo: string[], forwardNote: string) => {
    const report = get().getReportById(id);
    if (!report) return;

    const currentForwarded: string[] = report.forwardedTo || [];
    const newForwarded = [...new Set([...currentForwarded, ...forwardedTo])];

    await get().updateReport(id, {
      forwardedTo: newForwarded,
      forwardNote,
      updatedAt: new Date().toISOString(),
    });
  },

  deleteReport: async (id) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete report");
      }

      set((state) => ({ reports: state.reports.filter((r) => r.id !== id) }));
    } catch (error: any) {
      console.error("❌ ReportStore: deleteReport failed", error.message);
      throw error;
    }
  },

  clearAll: () => set({ reports: [] }),

  getReportById: (id: string) => {
    return get().reports.find((r) => r.id === id);
  },
}));
