"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string; // ชื่อของ entity ที่ถูกกระทำ (เช่น ชื่อ job, ชื่อ inventory)
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: string;
  details?: string; // รายละเอียดเพิ่มเติม
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[]; // เก็บการเปลี่ยนแปลง (สำหรับ update)
  metadata?: Record<string, any>; // ข้อมูลเพิ่มเติม
}

// Audit Log Store Interface
interface AuditLogStoreState {
  auditLogs: AuditLog[];
  isHydrated: boolean;
  
  // Actions
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  getAuditLogs: () => AuditLog[];
  getAuditLogsByEntity: (entityType: AuditEntityType, entityId?: string) => AuditLog[];
  getAuditLogsByUser: (userId: string) => AuditLog[];
  clearAuditLogs: () => void;
}

// Create Audit Log Store
export const useAuditLogStore = create<AuditLogStoreState>()(
  persist(
    (set, get) => ({
      auditLogs: [],
      isHydrated: false,

      addAuditLog: (logData) => {
        const newLog: AuditLog = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          ...logData,
        };
        
        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs], // ใหม่สุดก่อน
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
        return get().auditLogs.filter((log) => log.performedBy.id === userId);
      },

      clearAuditLogs: () => {
        set({ auditLogs: [] });
      },
    }),
    {
      name: "audit-log-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
      version: 1,
    }
  )
);

