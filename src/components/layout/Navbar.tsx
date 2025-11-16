"use client";

import { Bell, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/stores/notificationStore";
import { UserBox } from "@/components/UserBox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { AppBreadcrumbs } from "../AppBreadcrumb";
import { Menu } from "lucide-react";
import { useUserStore } from "@/stores/features/userStore";
import { ModeToggle } from "../ModeToggle";
import GlobalSearch from "../global/GlobalSearch";
import Link from "next/link";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { currentUser } = useUserStore();
  const { notifications, unreadCount, markAsRead, clearAll } =useNotificationStore();

  return (
    <header className="w-full py-2 bg-background flex items-center justify-between px-4  relative z-50">

       {/* ☰ ปุ่มเปิด sidebar (เฉพาะมือถือ) */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-900 cursor-pointer"
        onClick={onToggleSidebar}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Left Section */}
      <div className="hidden lg:flex items-center gap-3">
        <AppBreadcrumbs/>
      </div>

      <div className="flex items-center gap-4">
        {/* Right Section */}
        <GlobalSearch/>

        <DropdownMenu>
          <DropdownMenuTrigger asChild className="hidden md:flex ">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
  
          <DropdownMenuContent className=" w-fit md:w-64 p-2" align="end">
            <div className="flex justify-between items-center mb-2 px-2">
              <h2 className="font-semibold">Notifications</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => notifications.forEach((n) => markAsRead(n.id))}
              >
                Mark all read
              </Button>
            </div>
  
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0  }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: 0.1 * i }}
                      className={`p-2 rounded hover:bg-muted cursor-pointer  ${
                        n.read ? "bg-muted/30" : "bg-muted/60"
                      }`}
                      onClick={() => markAsRead(n.id)}
                    >
                      {n.description || "No description available"}
                      {n.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notifications
                  </p>
                )}
              </AnimatePresence>
            </div>
  
            <DropdownMenuItem asChild className="mt-2">
              <Link
                href={`/dashboard/${currentUser?.role}/notification`}
                className="w-full text-center text-sm text-primary font-medium"
              >
                View All Notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/*UserBox */}
        <UserBox />
      </div>
    </header>
  );
}
