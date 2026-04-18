"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  attachments?: string | null;
  tags?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
}

interface ReportStore {
  reports: Report[];
  isHydrated: boolean;

  addReportLocal: (report: Report) => void;
  updateReportLocal: (report: Report) => void;
  deleteReportLocal: (id: string) => void;
  clearAll: () => void;
  getReportById: (id: string) => Report | undefined;
  fetchReports: () => Promise<void>;
  addReport: (data: any) => Promise<boolean>;
  updateReport: (id: string, data: any) => Promise<boolean>;
  deleteReport: (id: string) => Promise<boolean>;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: [],
      isHydrated: false,

      addReportLocal: (report) =>
        set((state) => ({ reports: [report, ...state.reports] })),

      updateReportLocal: (report) =>
        set((state) => ({
          reports: state.reports.map((r) => (r.id === report.id ? report : r)),
        })),

      deleteReportLocal: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),

      clearAll: () => set({ reports: [] }),

      getReportById: (id: string) => {
        return get().reports.find((r) => r.id === id);
      },

      fetchReports: async () => {
        try {
          const res = await fetch("/api/reports");
          const result = await res.json();
          if (res.ok && result.success) {
            set({ reports: result.data });
          }
        } catch (error) {
          console.error("Failed to fetch reports:", error);
        }
      },

      addReport: async (data) => {
        try {
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({ reports: [result.data, ...state.reports] }));
            return true;
          }
          return false;
        } catch (error) {
          console.error("Failed to add report:", error);
          return false;
        }
      },

      updateReport: async (id, data) => {
        try {
          const res = await fetch(`/api/reports/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({
              reports: state.reports.map((r) => (r.id === id ? result.data : r)),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error("Failed to update report:", error);
          return false;
        }
      },

      deleteReport: async (id) => {
        try {
          const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({
              reports: state.reports.filter((r) => r.id !== id),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error("Failed to delete report:", error);
          return false;
        }
      },
    }),
    {
      name: "report-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        (state as ReportStore).isHydrated = true;
        (state as ReportStore).fetchReports();
      },
      version: 1,
    }
  )
);
