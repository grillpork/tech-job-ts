import { Job } from "@/lib/types/job";

/**
 * Helper to extract and normalize departments from a job object.
 * Handles both array format and stringified JSON format from Prisma.
 */
export const getJobDepartments = (job: Partial<Job> & { department?: string }): string[] => {
  const depts = job.departments;
  if (depts) {
    if (Array.isArray(depts)) return depts;
    if (typeof depts === "string") {
      try {
        const parsed = JSON.parse(depts);
        if (Array.isArray(parsed)) return parsed;
        return [depts]; // Just a normal string
      } catch (e) {
        return [depts]; // Not JSON
      }
    }
  }
  if (job.department) {
    return [job.department];
  }
  return [];
};

/**
 * Helper to extract and normalize used inventory items from a job object.
 * Handles both array format and stringified JSON format from Prisma.
 */
export const getJobUsedInventory = (job: Partial<Job>): { id: string; qty: number }[] => {
  const items = job.usedInventory;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      return [];
    }
  }
  return [];
};
