"use client";
import { create } from "zustand";

export type Inventory = {
  id: string;
  name: string;
  quantity: number;
  location: string;
  status: "Available" | "In Use" | "Pending" | "Damaged";
  type: "Device" | "Accessory" | "Tool" | "Other";
  requireFrom: string;
};

interface InventoryStore {
  inventories: Inventory[];
  addInventory: (item: Inventory) => void;
  updateInventory: (item: Inventory) => void;
  deleteInventory: (id: string) => void;
  clearAll: () => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  inventories:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("inventories") || "[]")
      : [],

  addInventory: (item) =>
    set((state) => {
      const updated = [...state.inventories, item];
      localStorage.setItem("inventories", JSON.stringify(updated));
      return { inventories: updated };
    }),

  updateInventory: (item) =>
    set((state) => {
      const updated = state.inventories.map((inv) =>
        inv.id === item.id ? item : inv
      );
      localStorage.setItem("inventories", JSON.stringify(updated));
      return { inventories: updated };
    }),

  deleteInventory: (id) =>
    set((state) => {
      const updated = state.inventories.filter((inv) => inv.id !== id);
      localStorage.setItem("inventories", JSON.stringify(updated));
      return { inventories: updated };
    }),

  clearAll: () => {
    localStorage.removeItem("inventories");
    return { inventories: [] };
  },
}));
