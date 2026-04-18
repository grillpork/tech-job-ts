import { z } from "zod";

/**
 * Zod Schemas for Advanced API Input Validation
 */

export const jobSchema = z.object({
  title: z.string().min(3, "หัวข้อใบงานต้องมีอย่างน้อย 3 ตัวอักษร"),
  description: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  leadTechnicianId: z.string().uuid().optional().nullable(),
  assignedEmployeeIds: z.array(z.string().uuid()).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  location: z.any().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export const inventorySchema = z.object({
  sku: z.string().min(1, "กรุณาระบุ SKU").optional(),
  name: z.string().min(2, "ชื่อพัสดุต้องมีอย่างน้อย 2 ตัวอักษร"),
  category: z.string().optional(),
  quantity: z.number().int().min(0, "จำนวนต้องไม่ติดลบ"),
  minStock: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  type: z.string().optional(),
});

export const inventoryRequestSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().max(500).optional().nullable(),
});
