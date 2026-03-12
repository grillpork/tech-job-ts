"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_REPORTS } from "@/lib/mocks/report";

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

  addReport: (report: Report) => void;
  updateReport: (report: Report) => void;
  deleteReport: (id: string) => void;
  clearAll: () => void;
  reorderReports: (orderedIds: string[]) => void;
  getReportById: (id: string) => Report | undefined;
  fetchReports: () => Promise<void>;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: [],
      isHydrated: false,

      addReport: (report) =>
        set((state) => ({ reports: [report, ...state.reports] })),

      updateReport: (report) =>
        set((state) => ({
          reports: state.reports.map((r) => (r.id === report.id ? report : r)),
        })),

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),

      clearAll: () => set({ reports: [] }),

      reorderReports: (orderedIds) =>
        set((state) => {
          const idToItem = new Map(state.reports.map((it) => [it.id, it]));
          const next: Report[] = [];
          for (const id of orderedIds) {
            const item = idToItem.get(id);
            if (item) next.push(item);
          }
          for (const item of state.reports) {
            if (!orderedIds.includes(item.id)) {
              next.push(item);
            }
          }
          return { reports: next };
        }),

      getReportById: (id: string) => {
        return get().reports.find((r) => r.id === id);
      },

      fetchReports: async () => {
        try {
          const res = await fetch("/api/reports");
          if (res.ok) {
            const reports = await res.json();
            set({ reports });
          }
        } catch (error) {
          console.error("Failed to fetch reports:", error);
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
