"use client";
import { create } from "zustand";
import { notificationHelpers } from "@/stores/notificationStore";
import { useJobStore } from "./jobStore";

export type Inventory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  location?: string | null;
  status: "พร้อมใช้" | "ใกล้หมด" | "หมด";
  type: "ต้องคืน" | "ไม่ต้องคืน";
  price: number;
  requireFrom?: string | null;
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

  // Inventory CRUD — all synced to DB
  addInventory: (item: Omit<Inventory, "id">) => Promise<Inventory | null>;
  updateInventory: (item: Inventory) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  clearAll: () => void;
  reorderInventory: (orderedIds: string[]) => void;
  fetchInventory: () => Promise<void>;

  // Inventory Request functions — local state only for now
  addInventoryRequest: (request: Omit<InventoryRequest, "id" | "requestedAt">) => string;
  updateInventoryRequestStatus: (
    requestId: string,
    status: InventoryRequestStatus,
    updatedBy: { id: string; name: string },
    note?: string | null
  ) => void;
  getInventoryRequestByJobId: (jobId: string) => InventoryRequest | undefined;
  getInventoryRequestStatus: (jobId: string) => InventoryRequestStatus | null;
}

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  inventories: [],
  inventoryRequests: [],
  isHydrated: false,

  fetchInventory: async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        // Handle both raw array and structured { data: [] }
        const inventories = Array.isArray(data) ? data : (data.data ?? []);
        set({ inventories, isHydrated: true });
        console.log("✅ InventoryStore: Fetched from API.", inventories.length, "items");
      } else {
        console.error("❌ InventoryStore: API error", res.status);
      }
    } catch (e) {
      console.error("❌ InventoryStore: Failed to fetch inventory", e);
    }
  },

  addInventory: async (itemData) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create inventory item');
      }

      const newItem: Inventory = await res.json();
      set((state) => ({ inventories: [...state.inventories, newItem] }));
      return newItem;
    } catch (error: any) {
      console.error("❌ InventoryStore: addInventory failed", error.message);
      return null;
    }
  },

  updateInventory: async (item) => {
    try {
      const { id, ...data } = item;
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update inventory item');
      }

      const updated: Inventory = await res.json();
      set((state) => ({
        inventories: state.inventories.map((inv) => (inv.id === id ? updated : inv)),
      }));
    } catch (error: any) {
      console.error("❌ InventoryStore: updateInventory failed", error.message);
      throw error;
    }
  },

  deleteInventory: async (id) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete inventory item');
      }

      set((state) => ({
        inventories: state.inventories.filter((inv) => inv.id !== id),
      }));
    } catch (error: any) {
      console.error("❌ InventoryStore: deleteInventory failed", error.message);
      throw error;
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
        if (!orderedIds.includes(item.id)) next.push(item);
      }
      return { inventories: next };
    }),

  // ---- Inventory Request functions (still local state for realtime UX) ----
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
    const targetIndex = currentRequests.findIndex((r) => r.id === requestId);
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
  },

  getInventoryRequestByJobId: (jobId) => {
    return get().inventoryRequests.find((req) => req.jobId === jobId);
  },

  // ✅ Fixed: คืน null แทน "pending" เมื่อไม่มี request
  getInventoryRequestStatus: (jobId) => {
    const request = get().inventoryRequests.find((req) => req.jobId === jobId);
    return request?.status ?? null;
  },
}));

// Auto-fetch on first use (call this in your layout or provider)
export function initInventoryStore() {
  useInventoryStore.getState().fetchInventory();
}
