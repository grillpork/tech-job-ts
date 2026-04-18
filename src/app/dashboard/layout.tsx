"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { ClientAuthGuard } from "@/components/ClientAuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { GlobalModal } from "@/components/global/GlobalModal";
import { GlobalToast } from "@/components/global/GlobalToast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ ตรวจขนาดจอหลังจาก mount แล้ว
  useEffect(() => {
    const handleResize = () => { }; 
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ClientAuthGuard>
      <Toaster position="top-right" richColors closeButton />
      <GlobalModal />
      <GlobalToast />
      
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (ซ้าย) */}
        {/* ✅ Desktop */}
        <aside className="hidden lg:block bg-muted/40 border-r">
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
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
