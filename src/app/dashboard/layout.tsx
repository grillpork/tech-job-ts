"use client";

import { useState } from "react";
import { ClientAuthGuard } from "@/components/ClientAuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ClientAuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
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
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
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
          {/* ✅ Navbar ด้านบน */}
          <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

          {/* ✅ Content */}
          <main className="flex-1 px-4 overflow-y-auto">
            <Card className="p-4 h-full overflow-auto">{children}</Card>
          </main>
        </div>
      </div>
    </ClientAuthGuard>
  );
}
