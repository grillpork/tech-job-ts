import { create } from 'zustand';

/**
 * Global UI Store for managing Toast notifications and Confirmation Modals
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ModalConfig {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

interface UIStore {
  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // Confirmation Modals
  modal: ModalConfig | null;
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    
    // Auto remove after 3s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  modal: null,
  openModal: (config) => set({ modal: config }),
  closeModal: () => set({ modal: null }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
