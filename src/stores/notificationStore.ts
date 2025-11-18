"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type NotificationType = 
  | "job_created" 
  | "job_updated" 
  | "job_completed" 
  | "job_assigned"
  | "job_status_changed"
  | "report_submitted" 
  | "report_assigned" 
  | "report_resolved"
  | "user_created"
  | "inventory_low"
  | "inventory_request_created"
  | "inventory_request_approved"
  | "inventory_request_rejected"
  | "task_assigned"
  | "message"
  | "comment"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  user?: string;
  timestamp: string;
  read: boolean;
  link?: string; // Optional link to related page
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isHydrated: boolean;
  
  addNotification: (notification: Omit<Notification, "id" | "read" | "timestamp" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isHydrated: false,

      addNotification: (notificationData) => {
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          ...notificationData,
          read: false,
          timestamp: new Date().toLocaleString("th-TH", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: new Date().toISOString(),
        };
        const updated = [newNotification, ...get().notifications];
        set({ 
          notifications: updated, 
          unreadCount: updated.filter(n => !n.read).length 
        });
      },

      markAsRead: (id) => {
        const updated = get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        set({ 
          notifications: updated, 
          unreadCount: updated.filter(n => !n.read).length 
        });
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({ ...n, read: true }));
        set({ 
          notifications: updated, 
          unreadCount: 0 
        });
      },

      deleteNotification: (id) => {
        const updated = get().notifications.filter((n) => n.id !== id);
        set({ 
          notifications: updated, 
          unreadCount: updated.filter(n => !n.read).length 
        });
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),

      getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        (state as NotificationStore).isHydrated = true;
        (state as NotificationStore).unreadCount = state.notifications.filter(n => !n.read).length;
      },
      version: 1,
    }
  )
);

// Helper functions to create notifications from various actions
export const notificationHelpers = {
  jobCreated: (jobTitle: string, creatorName: string, jobId: string) => {
    useNotificationStore.getState().addNotification({
      type: "job_created",
      title: `งานใหม่: ${jobTitle}`,
      description: `${creatorName} สร้างงานใหม่`,
      user: creatorName,
      link: `/dashboard/admin/jobs/${jobId}`,
    });
  },

  jobUpdated: (jobTitle: string, updaterName: string, jobId: string) => {
    useNotificationStore.getState().addNotification({
      type: "job_updated",
      title: `อัปเดตงาน: ${jobTitle}`,
      description: `${updaterName} อัปเดตงาน`,
      user: updaterName,
      link: `/dashboard/admin/jobs/${jobId}`,
    });
  },

  jobCompleted: (jobTitle: string, completerName: string, jobId: string) => {
    useNotificationStore.getState().addNotification({
      type: "job_completed",
      title: `งานเสร็จสิ้น: ${jobTitle}`,
      description: `${completerName} ทำงานเสร็จสิ้น`,
      user: completerName,
      link: `/dashboard/admin/jobs/${jobId}`,
    });
  },

  reportSubmitted: (reportTitle: string, reporterName: string, reportId: string) => {
    useNotificationStore.getState().addNotification({
      type: "report_submitted",
      title: `รายงานใหม่: ${reportTitle}`,
      description: `${reporterName} ส่งรายงานใหม่`,
      user: reporterName,
      link: `/dashboard/admin/reports`,
    });
  },

  reportAssigned: (reportTitle: string, assigneeName: string, reportId: string) => {
    useNotificationStore.getState().addNotification({
      type: "report_assigned",
      title: `มอบหมายรายงาน: ${reportTitle}`,
      description: `มอบหมายให้ ${assigneeName}`,
      user: assigneeName,
      link: `/dashboard/admin/reports`,
    });
  },

  reportResolved: (reportTitle: string, resolverName: string, reportId: string) => {
    useNotificationStore.getState().addNotification({
      type: "report_resolved",
      title: `แก้ไขรายงาน: ${reportTitle}`,
      description: `${resolverName} แก้ไขรายงานแล้ว`,
      user: resolverName,
      link: `/dashboard/admin/reports`,
    });
  },

  userCreated: (userName: string, userId: string) => {
    useNotificationStore.getState().addNotification({
      type: "user_created",
      title: `ผู้ใช้ใหม่: ${userName}`,
      description: `เพิ่มผู้ใช้ใหม่ในระบบ`,
      user: userName,
      link: `/dashboard/admin/users/${userId}`,
    });
  },

  inventoryLow: (itemName: string, quantity: number) => {
    useNotificationStore.getState().addNotification({
      type: "inventory_low",
      title: `อุปกรณ์ใกล้หมด: ${itemName}`,
      description: `เหลือเพียง ${quantity} ชิ้น`,
      link: `/dashboard/admin/inventorys`,
    });
  },

  jobAssigned: (jobTitle: string, assignerName: string, jobId: string) => {
    useNotificationStore.getState().addNotification({
      type: "job_assigned",
      title: `มอบหมายงาน: ${jobTitle}`,
      description: `${assignerName} มอบหมายงานให้คุณ`,
      user: assignerName,
      link: `/dashboard/employee/jobs/${jobId}`,
    });
  },

  jobStatusChanged: (jobTitle: string, status: string, jobId: string) => {
    const statusLabels: Record<string, string> = {
      pending: "รอดำเนินการ",
      in_progress: "กำลังดำเนินการ",
      pending_approval: "รออนุมัติ",
      completed: "เสร็จสมบูรณ์",
      cancelled: "ยกเลิก",
      rejected: "ปฏิเสธ",
    };
    
    useNotificationStore.getState().addNotification({
      type: "job_status_changed",
      title: `สถานะงานเปลี่ยน: ${jobTitle}`,
      description: `สถานะเปลี่ยนเป็น: ${statusLabels[status] || status}`,
      link: `/dashboard/employee/jobs/${jobId}`,
    });
  },

  inventoryRequestCreated: (jobTitle: string, requesterName: string, requestId: string, jobId: string) => {
    useNotificationStore.getState().addNotification({
      type: "inventory_request_created",
      title: `คำขอเบิกวัสดุ: ${jobTitle}`,
      description: `${requesterName} สร้างคำขอเบิกวัสดุ`,
      user: requesterName,
      link: `/dashboard/employee/jobs/${jobId}`,
    });
  },

  inventoryRequestApproved: (jobTitle: string, approverName: string, requestId: string, jobId: string) => {
    useNotificationStore.getState().addNotification({
      type: "inventory_request_approved",
      title: `อนุมัติเบิกวัสดุ: ${jobTitle}`,
      description: `${approverName} อนุมัติคำขอเบิกวัสดุแล้ว`,
      user: approverName,
      link: `/dashboard/employee/jobs/${jobId}`,
    });
  },

  inventoryRequestRejected: (jobTitle: string, rejecterName: string, requestId: string, jobId: string, reason?: string) => {
    useNotificationStore.getState().addNotification({
      type: "inventory_request_rejected",
      title: `ปฏิเสธเบิกวัสดุ: ${jobTitle}`,
      description: reason 
        ? `${rejecterName} ปฏิเสธคำขอ: ${reason}`
        : `${rejecterName} ปฏิเสธคำขอเบิกวัสดุ`,
      user: rejecterName,
      link: `/dashboard/employee/jobs/${jobId}`,
    });
  },
};
