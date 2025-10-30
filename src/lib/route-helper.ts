// src/lib/utils/route-helper.ts
export function getNotificationPathByRole(role: string): string {
  if (["admin", "manager", "lead_technician"].includes(role)) {
    return "/dashboard/admin/notifications";
  }
  return "/dashboard/employee/notifications";
}

export function getHistoryPathByRole(role: string): string {
  if (["admin", "manager", "lead_technician"].includes(role)) {
    return "/dashboard/admin/history";
  }
  return "/dashboard/employee/history";
}

export function getProfilePathByRole(role: string): string {
  if (["admin", "manager", "lead_technician"].includes(role)) {
    return "/dashboard/admin/profile";
  }
  return "/dashboard/employee/profile";
}
