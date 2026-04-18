"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Inventory } from "@/lib/types/inventory";
import { useJobStore } from "./jobStore";
import { useUIStore } from "@/stores/uiStore";
import { notificationHelpers } from "@/stores/notificationStore";

export type InventoryRequestStatus = "pending" | "approved" | "rejected";

export type InventoryRequest = {
  id: string;
  jobId: string;
  status: InventoryRequestStatus;
  items: string; // JSON from DB
  requestedById: string;
  requestedBy: { id: string; name: string };
  requestedAt: string;
  processedById?: string | null;
  processedBy?: { id: string; name: string } | null;
  processedAt?: string | null;
  note?: string | null;
};

interface InventoryStore {
  inventories: Inventory[];
  inventoryRequests: InventoryRequest[];
  isHydrated: boolean;
  addInventory: (item: Inventory) => Promise<boolean>;
  updateInventory: (item: Inventory) => Promise<boolean>;
  deleteInventory: (id: string) => Promise<boolean>;
  clearAll: () => void;
  reorderInventory: (orderedIds: string[]) => void;
  fetchInventory: () => Promise<void>;
  addInventoryRequest: (request: any) => Promise<void>;
  getInventoryRequestStatus: (jobId: string) => InventoryRequestStatus | null;
  getInventoryRequestByJobId: (jobId: string) => InventoryRequest | undefined;
  updateInventoryRequestStatus: (
    requestId: string,
    status: InventoryRequestStatus,
    updatedBy: { id: string; name: string },
    note?: string | null
  ) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventories: [],
      inventoryRequests: [],
      isHydrated: false,

      addInventory: async (item) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({ inventories: [result.data, ...state.inventories] }));
            addToast(result.message || "เพิ่มพัสดุสำเร็จ", "success");
            return true;
          }
          addToast(result.message || "ไม่สามารถเพิ่มพัสดุได้", "error");
          return false;
        } catch (error) {
          console.error("Error in addInventory:", error);
          return false;
        }
      },

      updateInventory: async (item) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch(`/api/inventory/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });

          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({
              inventories: state.inventories.map((inv) =>
                inv.id === item.id ? result.data : inv
              ),
            }));
            addToast(result.message || "แก้ไขพัสดุสำเร็จ", "success");
            return true;
          }
          addToast(result.message || "ไม่สามารถแก้ไขพัสดุได้", "error");
          return false;
        } catch (error) {
          console.error("Error in updateInventory:", error);
          return false;
        }
      },

      deleteInventory: async (id) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch(`/api/inventory/${id}`, {
            method: 'DELETE',
          });

          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({
              inventories: state.inventories.filter((inv) => inv.id !== id),
            }));
            addToast(result.message || "ลบพัสดุสำเร็จ", "success");
            return true;
          }
          addToast(result.message || "ไม่สามารถลบพัสดุได้", "error");
          return false;
        } catch (error) {
          console.error("Error in deleteInventory:", error);
          return false;
        }
      },

      clearAll: () => set({ inventories: [] }),

      reorderInventory: (orderedIds) =>
        set((state) => {
          const idToItem = new Map(state.inventories.map((it) => [it.id, it]));
          const next: Inventory[] = [];
          for (const id of orderedIds) {
            const item = idToItem.get(id);
            if (item) next.push(item);
          }
          for (const item of state.inventories) {
            if (!orderedIds.includes(item.id)) {
              next.push(item);
            }
          }
          return { inventories: next };
        }),

      fetchInventory: async () => {
        try {
          const [invRes, reqRes] = await Promise.all([
            fetch('/api/inventory'),
            fetch('/api/inventory/requests')
          ]);
          
          const invResult = await invRes.json();
          const reqResult = await reqRes.json();

          if (invRes.ok && invResult.success) {
            set({ inventories: invResult.data });
          }
          
          if (reqRes.ok && reqResult.success) {
            set({ inventoryRequests: reqResult.data });
          }
        } catch (e) {
          console.error("Failed to fetch inventory data", e);
        }
      },

      addInventoryRequest: async (requestData) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch('/api/inventory/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId: requestData.jobId,
              requestedItems: requestData.requestedItems,
              note: requestData.note
            })
          });
          const result = await res.json();
          if (res.ok && result.success) {
            set((state) => ({
              inventoryRequests: [...state.inventoryRequests, result.data],
            }));
            
            const job = useJobStore.getState().getJobById(requestData.jobId);
            if (job) {
              notificationHelpers.inventoryRequestCreated(
                job.title,
                requestData.requestedBy.name,
                result.data.id,
                requestData.jobId
              );
            }
            addToast(result.message || "สร้างคำขอเบิกสำเร็จ", "success");
          } else {
            addToast(result.message || "ไม่สามารถสร้างคำขอเบิกได้", "error");
          }
        } catch (err) {
          console.error("Failed to sync inventory request", err);
        }
      },

      getInventoryRequestStatus: (jobId: string) => {
        const req = get().inventoryRequests.find(r => r.jobId === jobId);
        return req?.status || null;
      },
      
      getInventoryRequestByJobId: (jobId: string) => {
        return get().inventoryRequests.find(r => r.jobId === jobId);
      },

      updateInventoryRequestStatus: async (requestId, status, updatedBy, note) => {
        const { addToast } = useUIStore.getState();
        try {
          const res = await fetch(`/api/inventory/requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, note })
          });

          const result = await res.json();
          if (res.ok && result.success) {
            const updatedRequest = result.data;
            set((state) => ({
              inventoryRequests: state.inventoryRequests.map((r) => 
                r.id === requestId ? updatedRequest : r
              ),
            }));

            addToast(result.message || "ปรับปรุงสถานะเรียบร้อยแล้ว", "success");
            await get().fetchInventory();
            
            const job = useJobStore.getState().getJobById(updatedRequest.jobId);
            if (job) {
              if (status === "approved") {
                notificationHelpers.inventoryRequestApproved(job.title, updatedBy.name, requestId, updatedRequest.jobId);
              } else if (status === "rejected") {
                notificationHelpers.inventoryRequestRejected(job.title, updatedBy.name, requestId, updatedRequest.jobId, note || undefined);
              }
            }
          } else {
            addToast(result.message || "ไม่สามารถปรับปรุงสถานะได้", "error");
          }
        } catch (error) {
          console.error("Failed to update inventory request status:", error);
        }
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          state.fetchInventory();
        }
      },
    }
  )
);
