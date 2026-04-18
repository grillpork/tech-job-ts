export type Inventory = {
  id: string;
  sku?: string | null;
  name: string;
  category?: string | null;
  imageUrl?: string | null;
  quantity: number;
  minStock: number;
  location: string;
  status: "พร้อมใช้" | "ใกล้หมด" | "หมด";
  type: "ต้องคืน" | "ไม่ต้องคืน";
  price: number;
  requireFrom: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};