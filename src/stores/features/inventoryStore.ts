"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_INVENTORIES } from "@/lib/mocks/inventory";
import { useAuditLogStore } from "./auditLogStore";
import { useUserStore } from "./userStore";
import { notificationHelpers } from "@/stores/notificationStore";
import { useJobStore } from "./jobStore";

export type Inventory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  location: string;
  status: "พร้อมใช้" | "ใกล้หมด" | "หมด";
  type: "ต้องคืน" | "ไม่ต้องคืน";
  price: number;
  requireFrom: string;
};

export type InventoryRequestStatus = "pending" | "approved" | "rejected";

export type InventoryRequest = {
  id: string;
  jobId: string;
  status: InventoryRequestStatus;
  requestedItems: { id: string; qty: number }[];
  requestedBy: { id: string; name: string };
  requestedAt: string;
  approvedBy?: { id: string; name: string } | null;
  approvedAt?: string | null;
  rejectedBy?: { id: string; name: string } | null;
  rejectedAt?: string | null;
  note?: string | null;
};

interface InventoryStore {
  inventories: Inventory[];
  inventoryRequests: InventoryRequest[];
  isHydrated: boolean;
  addInventory: (item: Inventory) => void;
  updateInventory: (item: Inventory) => void;
  deleteInventory: (id: string) => void;
  clearAll: () => void;
  reorderInventory: (orderedIds: string[]) => void;
  // Inventory Request functions
  addInventoryRequest: (request: Omit<InventoryRequest, "id" | "requestedAt">) => string;
  updateInventoryRequestStatus: (
    requestId: string,
    status: InventoryRequestStatus,
    updatedBy: { id: string; name: string },
    note?: string | null
  ) => void;
  getInventoryRequestByJobId: (jobId: string) => InventoryRequest | undefined;
  getInventoryRequestStatus: (jobId: string) => InventoryRequestStatus;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventories: MOCK_INVENTORIES,
      inventoryRequests: [],
      isHydrated: false,

      addInventory: (item) => {
        // 💡 แก้ไข: กำหนด Default Value ให้ price ถ้า item.price เป็น undefined
        const newItem = {
          ...item,
          price: item.price || 0, // หรือใส่ค่า default อื่นๆ ที่เหมาะสม
        };
        set((state) => ({ inventories: [...state.inventories, newItem] }));
        
        // ✅ บันทึก audit log
        try {
          const currentUser = useUserStore.getState().currentUser;
          if (currentUser) {
            useAuditLogStore.getState().addAuditLog({
              action: "create",
              entityType: "inventory",
              entityId: newItem.id,
              entityName: newItem.name,
              performedBy: {
                id: currentUser.id,
                name: currentUser.name,
                role: currentUser.role,
              },
              details: `เพิ่มสินค้า: ${newItem.name} (จำนวน: ${newItem.quantity})`,
            });
          }
        } catch (error) {
          console.error("Failed to log audit:", error);
        }
      },

      updateInventory: (item) => {
        const oldItem = get().inventories.find((inv) => inv.id === item.id);
        
        set((state) => ({
          inventories: state.inventories.map((inv) =>
            inv.id === item.id
              ? {
                  ...item,
                  price: item.price || inv.price || 0 // 💡 ใช้ price ที่ส่งมา หรือ price เดิม หรือ 0
                }
              : inv
          ),
        }));
        
        // ✅ บันทึก audit log
        try {
          const currentUser = useUserStore.getState().currentUser;
          if (currentUser && oldItem) {
            const changes: { field: string; oldValue: any; newValue: any }[] = [];
            if (item.name !== oldItem.name) changes.push({ field: "name", oldValue: oldItem.name, newValue: item.name });
            if (item.quantity !== oldItem.quantity) changes.push({ field: "quantity", oldValue: oldItem.quantity, newValue: item.quantity });
            if (item.status !== oldItem.status) changes.push({ field: "status", oldValue: oldItem.status, newValue: item.status });
            
            useAuditLogStore.getState().addAuditLog({
              action: "update",
              entityType: "inventory",
              entityId: item.id,
              entityName: item.name,
              performedBy: {
                id: currentUser.id,
                name: currentUser.name,
                role: currentUser.role,
              },
              details: `แก้ไขสินค้า: ${item.name}`,
              changes: changes.length > 0 ? changes : undefined,
            });
          }
        } catch (error) {
          console.error("Failed to log audit:", error);
        }
      },

      deleteInventory: (id) => {
        const item = get().inventories.find((inv) => inv.id === id);
        
        // ✅ บันทึก audit log ก่อนลบ
        if (item) {
          try {
            const currentUser = useUserStore.getState().currentUser;
            if (currentUser) {
              useAuditLogStore.getState().addAuditLog({
                action: "delete",
                entityType: "inventory",
                entityId: item.id,
                entityName: item.name,
                performedBy: {
                  id: currentUser.id,
                  name: currentUser.name,
                  role: currentUser.role,
                },
                details: `ลบสินค้า: ${item.name}`,
              });
            }
          } catch (error) {
            console.error("Failed to log audit:", error);
          }
        }
        
        set((state) => ({
          inventories: state.inventories.filter((inv) => inv.id !== id),
        }));
      },

      clearAll: () => set({ inventories: [] }),

      // Reorder inventories according to an array of ids (new order)
      reorderInventory: (orderedIds) =>
        set((state) => {
          const idToItem = new Map(state.inventories.map((it) => [it.id, it]));
          const next: Inventory[] = [];
          // keep only ids that exist and preserve new order
          for (const id of orderedIds) {
            const item = idToItem.get(id);
            if (item) next.push(item);
          }
          // append any items that were not included to avoid accidental loss
          for (const item of state.inventories) {
            if (!orderedIds.includes(item.id)) {
              next.push(item);
            }
          }
          return { inventories: next };
        }),

      // Inventory Request functions
      addInventoryRequest: (requestData) => {
        const newRequest: InventoryRequest = {
          id: crypto.randomUUID(),
          ...requestData,
          requestedAt: new Date().toISOString(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          note: requestData.note || null,
        };
        set((state) => ({
          inventoryRequests: [...state.inventoryRequests, newRequest],
        }));
        
        // ✅ สร้าง notification
        try {
          const job = useJobStore.getState().getJobById(requestData.jobId);
          if (job) {
            notificationHelpers.inventoryRequestCreated(
              job.title,
              requestData.requestedBy.name,
              newRequest.id,
              requestData.jobId
            );
          }
        } catch (error) {
          console.error("Failed to create notification:", error);
        }
        
        return newRequest.id;
      },

      updateInventoryRequestStatus: (requestId, status, updatedBy, note) => {
        let updatedRequest: InventoryRequest | null = null;
        
        set((state) => ({
          inventoryRequests: state.inventoryRequests.map((req) => {
            if (req.id === requestId) {
              const updateData: Partial<InventoryRequest> = {
                status,
                note: note !== undefined ? note : req.note,
              };

              if (status === "approved") {
                updateData.approvedBy = updatedBy;
                updateData.approvedAt = new Date().toISOString();
                updateData.rejectedBy = null;
                updateData.rejectedAt = null;
              } else if (status === "rejected") {
                updateData.rejectedBy = updatedBy;
                updateData.rejectedAt = new Date().toISOString();
                updateData.approvedBy = null;
                updateData.approvedAt = null;
              }

              updatedRequest = { ...req, ...updateData };
              return updatedRequest;
            }
            return req;
          }),
        }));
        
        // ✅ สร้าง notification
        if (updatedRequest) {
          try {
            const job = useJobStore.getState().getJobById(updatedRequest.jobId);
            if (job) {
              if (status === "approved") {
                notificationHelpers.inventoryRequestApproved(
                  job.title,
                  updatedBy.name,
                  requestId,
                  updatedRequest.jobId
                );
              } else if (status === "rejected") {
                notificationHelpers.inventoryRequestRejected(
                  job.title,
                  updatedBy.name,
                  requestId,
                  updatedRequest.jobId,
                  note || undefined
                );
              }
            }
          } catch (error) {
            console.error("Failed to create notification:", error);
          }
        }
      },

      getInventoryRequestByJobId: (jobId) => {
        return get().inventoryRequests.find((req) => req.jobId === jobId);
      },

      getInventoryRequestStatus: (jobId) => {
        const request = get().inventoryRequests.find((req) => req.jobId === jobId);
        return request?.status || "pending";
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.inventories || state.inventories.length === 0) {
          console.log("InventoryStore: Loading MOCK_INVENTORIES...");
          (state as InventoryStore).inventories = MOCK_INVENTORIES;
        }
        (state as InventoryStore).isHydrated = true;
      },
    }
  )
);
