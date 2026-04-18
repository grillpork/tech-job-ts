"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Error Boundary:", error);
  }, [error]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="p-6 bg-rose-500/10 rounded-3xl mb-8 border border-rose-500/20 shadow-xl shadow-rose-500/5">
        <AlertTriangle className="h-16 w-16 text-rose-500" />
      </div>
      
      <div className="space-y-4 max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">เกิดข้อผิดพลาดในการโหลดข้อมูล</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          ระบบพบปัญหาที่ไม่คาดคิดในการประมวลผลข้อมูลหน้านี้ โปรดลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่
        </p>
        
        {process.env.NODE_ENV === 'development' && (
             <div className="mt-4 p-4 bg-muted rounded-xl text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-rose-500 opacity-80">{error.message}</p>
             </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
        <Button 
          onClick={() => reset()} 
          size="lg" 
          className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
        >
          <RefreshCw className="h-5 w-5" />
          ลองใหม่อีกครั้ง
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 px-8 font-bold gap-2 border-muted-foreground/20">
          <Link href="/dashboard">
            <Home className="h-5 w-5" />
            กลับหน้าแรก
          </Link>
        </Button>
      </div>
    </div>
  );
}
