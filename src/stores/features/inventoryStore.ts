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
  requireFrom: string;
};

interface InventoryStore {
  inventories: Inventory[];
  isHydrated: boolean;
  addInventory: (item: Inventory) => void;
  updateInventory: (item: Inventory) => void;
  deleteInventory: (id: string) => void;
  clearAll: () => void;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventories: MOCK_INVENTORIES,
      isHydrated: false,

      addInventory: (item) =>
        set((state) => ({ inventories: [...state.inventories, item] })),

      updateInventory: (item) =>
        set((state) => ({
          inventories: state.inventories.map((inv) =>
            inv.id === item.id ? item : inv
          ),
        })),

      deleteInventory: (id) =>
        set((state) => ({
          inventories: state.inventories.filter((inv) => inv.id !== id),
        })),

      clearAll: () => set({ inventories: [] }),
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
