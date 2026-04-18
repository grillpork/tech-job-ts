"use client";

import { useUIStore } from "@/stores/uiStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function GlobalModal() {
  const { modal, closeModal, isLoading } = useUIStore();

  if (!modal) return null;

  return (
    <AlertDialog open={!!modal} onOpenChange={(open) => !open && closeModal()}>
      <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-2xl font-bold tracking-tight">
            {modal.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed">
            {modal.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel 
            disabled={isLoading}
            className="rounded-2xl h-12 px-6 border-muted-foreground/20 hover:bg-muted font-semibold transition-all"
          >
            {modal.cancelText || "ยกเลิก"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              modal.onConfirm();
            }}
            className={`rounded-2xl h-12 px-8 font-bold shadow-lg transition-all ${
              modal.type === 'danger' 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              modal.confirmText || "ยืนยัน"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
