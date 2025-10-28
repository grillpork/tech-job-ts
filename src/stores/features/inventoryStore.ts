"use client";

import { create } from "zustand";

type Inventory = {
  id: string;
  name: string;
  quantity: number;
  location: string;
};

interface InventoryStore {
  inventories: Inventory[];
}

export const useInventoryStore = create<InventoryStore>(() => ({
  inventories: [
    { id: "1", name: "Laptop Dell XPS 15", quantity: 3, location: "IT Room" },
    { id: "2", name: "Mouse Logitech MX", quantity: 10, location: "Storage A" },
    { id: "3", name: "Monitor 27 inch", quantity: 5, location: "Office 2" },
  ],
}));
