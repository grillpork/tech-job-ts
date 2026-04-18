"use client";
import { create } from "zustand";

// ประเภทการกระทำ
export type AuditAction = 
  | "create" 
  | "update" 
  | "delete"
  | "approve"
  | "reject"
  | "assign"
  | "unassign";

// ประเภท entity ที่ถูกกระทำ
export type AuditEntityType = 
  | "job"
  | "inventory"
  | "user"
  | "report"
  | "inventory_request"
  | "completion_request";

// Audit Log Interface
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string; 
  performedById: string;
  performedByName: string;
  performedByRole: string;
  timestamp: string;
  details?: string;
  changes?: string; // JSON
  metadata?: string; // JSON
}

// Audit Log Store Interface
interface AuditLogStoreState {
  auditLogs: AuditLog[];
  isLoading: boolean;
  
  // Actions
  fetchAuditLogs: () => Promise<void>;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  getAuditLogs: () => AuditLog[];
  getAuditLogsByEntity: (entityType: string, entityId?: string) => AuditLog[];
  getAuditLogsByUser: (userId: string) => AuditLog[];
  clearAuditLogs: () => void;
}

// Create Audit Log Store
export const useAuditLogStore = create<AuditLogStoreState>((set, get) => ({
  auditLogs: [],
  isLoading: false,

  fetchAuditLogs: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/audit-logs');
      const result = await res.json();
      
      if (res.ok && result.success) {
        set({ auditLogs: result.data });
      }
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addAuditLog: (logData) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...logData,
    };
    
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs],
    }));
  },

  getAuditLogs: () => {
    return get().auditLogs;
  },

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
    return get().auditLogs.filter((log) => log.performedById === userId);
  },

  clearAuditLogs: () => {
    set({ auditLogs: [] });
  },
}));
