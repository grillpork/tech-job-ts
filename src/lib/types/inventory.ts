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