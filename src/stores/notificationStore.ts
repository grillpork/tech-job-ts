import { create } from "zustand";

export interface Notification {
  id: string;
  message: string;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [
    { id: "1", message: "Welcome to the dashboard!", read: false },
    { id: "2", message: "New task assigned by Manager.", read: false },
  ],
  unreadCount: 2,

  addNotification: (message) => {
    const newNotification = {
      id: Date.now().toString(),
      message,
      read: false,
    };
    const updated = [newNotification, ...get().notifications];
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
