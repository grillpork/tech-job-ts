"use client";

import { useEffect, useState } from "react";
import { ClientAuthGuard } from "@/components/ClientAuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { usePathname } from "next/navigation";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  // ✅ ตรวจขนาดจอหลังจาก mount แล้ว
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); // เรียกครั้งแรก
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ClientAuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (ซ้าย) */}
        {/* ✅ Desktop */}
        <aside className="hidden lg:block bg-muted/40 ">
          <Sidebar />
        </aside>

        {/* ✅ Mobile Sidebar (slide-in) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />

              {/* Sidebar */}
              <motion.aside
                className="fixed top-0 left-0 z-50 h-full w-64 bg-muted/40 border-r lg:hidden"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.25 }}
              >
                <Sidebar />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content (ขวา) */}
        <div className="flex flex-col flex-1">
          <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
            
          <main className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
                  animate={{ opacity: 1, y: 0 , filter: "blur(0px)"  }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
          </main>
        </div>
      </div>
    </ClientAuthGuard>
  );
}
