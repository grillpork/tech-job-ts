"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_INVENTORIES } from "@/lib/mocks/inventory";

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
  fetchInventory: () => Promise<void>;
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
        
        // TODO: Move Audit Log to Server Action / API
      },

      updateInventory: (item) => {
        // const oldItem = get().inventories.find((inv) => inv.id === item.id);
        
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
        
        // TODO: Move Audit Log to Server Action / API
      },

      deleteInventory: (id) => {
        // const item = get().inventories.find((inv) => inv.id === id);
        

        
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
        const currentRequests = get().inventoryRequests;
        const targetIndex = currentRequests.findIndex(r => r.id === requestId);
        
        if (targetIndex === -1) return;

        const req = currentRequests[targetIndex];
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

        const updatedRequest = { ...req, ...updateData };

        set((state) => ({
          inventoryRequests: state.inventoryRequests.map((r, i) => 
            i === targetIndex ? updatedRequest : r
          ),
        }));
        
        // ✅ สร้าง notification
        // No strict check needed for updatedRequest existence as we derived it from valid index
        try {
          // Check if method exists to avoid circular calls if any problem, but standard call is fine
          // Access jobStore via getState to avoid circular dependencies if imports are tricky, 
          // but we imported useJobStore.
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
      },

      getInventoryRequestByJobId: (jobId) => {
        return get().inventoryRequests.find((req) => req.jobId === jobId);
      },

      getInventoryRequestStatus: (jobId) => {
        const request = get().inventoryRequests.find((req) => req.jobId === jobId);
        return request?.status || "pending";
      },

      fetchInventory: async () => {
        try {
          const res = await fetch('/api/inventory');
          if (res.ok) {
            const data = await res.json();
            set({ inventories: data });
             console.log("✅ InventoryStore: Fetched from API.");
          }
        } catch (e) {
          console.error("Failed to fetch inventory", e);
        }
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          // Trigger fetch
          state.fetchInventory();
          console.log("✅ InventoryStore: Hydrated and fetch triggered.");
        }
      },
    }
  )
);
