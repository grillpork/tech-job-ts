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