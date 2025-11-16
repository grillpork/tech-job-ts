"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_INVENTORIES } from "@/lib/mocks/inventory";

export type Inventory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  location: string;
  status: "Available" | "In Use" | "Pending" | "Damaged";
  type: "Device" | "Accessory" | "Tool" | "Other";
  price: number;
  requireFrom: string;
};

interface InventoryStore {
  inventories: Inventory[];
  isHydrated: boolean;
  addInventory: (item: Inventory) => void;
  updateInventory: (item: Inventory) => void;
  deleteInventory: (id: string) => void;
  clearAll: () => void;
  reorderInventory: (orderedIds: string[]) => void;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventories: MOCK_INVENTORIES,
      isHydrated: false,

      addInventory: (item) => {
        // 💡 แก้ไข: กำหนด Default Value ให้ price ถ้า item.price เป็น undefined
        const newItem = {
          ...item,
          price: item.price || 0, // หรือใส่ค่า default อื่นๆ ที่เหมาะสม
        };
        set((state) => ({ inventories: [...state.inventories, newItem] }));
      },

      updateInventory: (item) =>
        set((state) => ({
          inventories: state.inventories.map((inv) =>
            inv.id === item.id
              ? {
                ...item,
                price: item.price || inv.price || 0 // 💡 ใช้ price ที่ส่งมา หรือ price เดิม หรือ 0
              }
              : inv
          ),
        })),

      deleteInventory: (id) =>
        set((state) => ({
          inventories: state.inventories.filter((inv) => inv.id !== id),
        })),

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
