"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { toast } from "sonner";

/**
 * Bridge component that connects UIStore toasts to Sonner
 */
export function GlobalToast() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length > 0) {
      const lastToast = toasts[toasts.length - 1];
      
      const options = {
        onDismiss: () => removeToast(lastToast.id),
        onAutoClose: () => removeToast(lastToast.id),
      };

      if (lastToast.type === 'success') toast.success(lastToast.message, options);
      else if (lastToast.type === 'error') toast.error(lastToast.message, options);
      else if (lastToast.type === 'warning') toast.warning(lastToast.message, options);
      else toast.info(lastToast.message, options);
    }
  }, [toasts, removeToast]);

  return null;
}
