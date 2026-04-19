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
  reporter: { id: string; name: string; imageUrl?: string | null };
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
}

interface ReportStore {
  reports: Report[];
  isHydrated: boolean;

  fetchReports: () => Promise<void>;
  addReport: (report: Omit<Report, "id" | "createdAt">) => Promise<Report | null>;
  updateReport: (id: string, data: Partial<Report>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  clearAll: () => void;
  getReportById: (id: string) => Report | undefined;
}

export const useReportStore = create<ReportStore>()((set, get) => ({
  reports: [],
  isHydrated: false,

  fetchReports: async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        // Handle both raw array and structured { data: [] }
        const reports = Array.isArray(data) ? data : (data.data ?? []);
        set({ reports, isHydrated: true });
        console.log("✅ ReportStore: Fetched", reports.length, "reports.");
      }
    } catch (error) {
      console.error("❌ ReportStore: Failed to fetch reports:", error);
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
