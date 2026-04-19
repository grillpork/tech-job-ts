"use client";
import { create } from "zustand";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "assign"
  | "unassign";

export type AuditEntityType =
  | "job"
  | "inventory"
  | "user"
  | "report"
  | "inventory_request"
  | "completion_request";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: string;
  details?: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata?: Record<string, unknown>;
}

interface AuditLogStoreState {
  auditLogs: AuditLog[];
  isHydrated: boolean;

  // Sync with DB
  fetchAuditLogs: () => Promise<void>;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp"> & {
    performedById: string;
    performedByName: string;
    performedByRole: string;
  }) => Promise<void>;

  // Local queries
  getAuditLogs: () => AuditLog[];
  getAuditLogsByEntity: (entityType: AuditEntityType, entityId?: string) => AuditLog[];
  getAuditLogsByUser: (userId: string) => AuditLog[];
  clearAuditLogs: () => void;
}

export const useAuditLogStore = create<AuditLogStoreState>()((set, get) => ({
  auditLogs: [],
  isHydrated: false,

  fetchAuditLogs: async () => {
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        const rawLogs = Array.isArray(data) ? data : (data.data ?? []);

        // Transform DB format → store format
        const auditLogs: AuditLog[] = rawLogs.map((log: any) => ({
          id: log.id,
          action: log.action.toLowerCase() as AuditAction,
          entityType: log.entityType.toLowerCase() as AuditEntityType,
          entityId: log.entityId,
          entityName: log.entityName,
          performedBy: {
            id: log.performedById,
            name: log.performedByName,
            role: log.performedByRole,
          },
          timestamp: log.timestamp,
          details: log.details || undefined,
          changes: log.changes ? JSON.parse(log.changes) : undefined,
          metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
        }));

        set({ auditLogs, isHydrated: true });
        console.log("✅ AuditLogStore: Fetched", auditLogs.length, "logs from DB.");
      }
    } catch (error) {
      console.error("❌ AuditLogStore: Failed to fetch logs", error);
    }
  },

  addAuditLog: async (logData) => {
    try {
      const res = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: logData.action.toUpperCase(),
          entityType: logData.entityType.toUpperCase(),
          entityId: logData.entityId,
          entityName: logData.entityName,
          performedById: logData.performedById,
          performedByName: logData.performedByName,
          performedByRole: logData.performedByRole,
          details: logData.details || null,
          changes: logData.changes || null,
          metadata: logData.metadata || null,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Add to local state optimistically
        const newLog: AuditLog = {
          id: saved.id,
          action: saved.action.toLowerCase() as AuditAction,
          entityType: saved.entityType.toLowerCase() as AuditEntityType,
          entityId: saved.entityId,
          entityName: saved.entityName,
          performedBy: {
            id: saved.performedById,
            name: saved.performedByName,
            role: saved.performedByRole,
          },
          timestamp: saved.timestamp,
          details: saved.details || undefined,
          changes: saved.changes ? JSON.parse(saved.changes) : undefined,
          metadata: saved.metadata ? JSON.parse(saved.metadata) : undefined,
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      }
    } catch (error) {
      console.error("❌ AuditLogStore: Failed to save log to DB", error);
    }
  },

  getAuditLogs: () => get().auditLogs,

  getAuditLogsByEntity: (entityType, entityId) => {
    const logs = get().auditLogs;
    if (entityId) {
      return logs.filter(
        (log) => log.entityType === entityType && log.entityId === entityId
      );
    }
    return logs.filter((log) => log.entityType === entityType);
  },

  getAuditLogsByUser: (userId) => {
    return get().auditLogs.filter((log) => log.performedBy.id === userId);
  },

  clearAuditLogs: () => set({ auditLogs: [] }),
}));
