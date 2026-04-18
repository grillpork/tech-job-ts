"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MoveLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 z-10"
      >
        <div className="relative inline-block">
          <motion.h1 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-[12rem] font-black leading-none tracking-tighter text-foreground/5 select-none"
          >
            404
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="p-6 bg-primary/10 rounded-full backdrop-blur-xl border border-primary/20 shadow-2xl">
                <HelpCircle className="h-16 w-16 text-primary animate-bounce" />
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">ไม่พบหน้าที่คุณต้องการ</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            ขออภัย หน้าที่คุณพยายามเข้าถึงอาจถูกลบ ย้าย หรือไม่มีอยู่จริงในระบบ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-xl shadow-primary/20">
            <Link href="/dashboard" className="flex items-center gap-2">
              <MoveLeft className="h-5 w-5" />
              กลับสู่แผงควบคุม
            </Link>
          </Button>
          <Button variant="ghost" size="lg" className="rounded-full px-8 h-14 text-base font-semibold" onClick={() => window.history.back()}>
            ย้อนไปหน้าก่อนหน้า
          </Button>
        </div>
      </motion.div>

      <footer className="absolute bottom-8 text-center w-full">
         <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
            Tech Job Management System • Enterprise Cloud
         </p>
      </footer>
    </div>
  );
}
