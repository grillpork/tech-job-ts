"use client";

import { Bell, X } from "lucide-react";
import { useState, useMemo } from "react";
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
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { ModeToggle } from "../ModeToggle";
import GlobalSearch from "../global/GlobalSearch";
import Link from "next/link";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { currentUser } = useUserStore();
  const { notifications, markAsRead } = useNotificationStore();
  const { jobs, getJobById } = useJobStore();
  const { inventoryRequests } = useInventoryStore();

  // กรอง notification ตาม role ของผู้ใช้
  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];

    // Admin เห็นทุก notification
    if (currentUser.role === "admin") {
      return notifications;
    }

    // สำหรับ role อื่นๆ กรองเฉพาะที่เกี่ยวข้อง
    return notifications.filter((notification) => {
      // Notification ที่ไม่เกี่ยวกับ job/inventory ให้แสดง (เช่น system, message, comment)
      if (!notification.type.startsWith("job_") && !notification.type.startsWith("inventory_")) {
        return true;
      }

      // ตรวจสอบจาก link (ถ้ามี jobId)
      if (notification.link) {
        const jobIdMatch = notification.link.match(/\/jobs\/([^\/]+)/);
        if (jobIdMatch) {
          const jobId = jobIdMatch[1];
          const job = getJobById(jobId);
          
          if (job) {
            // ตรวจสอบว่า user เกี่ยวข้องกับ job หรือไม่
            const isAssigned = job.assignedEmployees?.some((emp) => emp.id === currentUser.id);
            const isCreator = job.creator?.id === currentUser.id;
            const isLead = job.leadTechnician?.id === currentUser.id;
            
            if (isAssigned || isCreator || isLead) {
              return true;
            }
            
            // สำหรับ inventory request ตรวจสอบว่า user เป็นคนสร้าง request หรือไม่
            if (notification.type.startsWith("inventory_request_")) {
              const request = inventoryRequests.find((req) => req.jobId === jobId);
              if (request && request.requestedBy.id === currentUser.id) {
                return true;
              }
            }
          }
        }
      }

      // ถ้าไม่มี link หรือไม่พบ job ให้ไม่แสดง (ยกเว้น system notification)
      return false;
    });
  }, [notifications, currentUser, jobs, getJobById, inventoryRequests]);

  // คำนวณ unread count จาก filtered notifications
  const unreadCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.read).length;
  }, [filteredNotifications]);

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
  
          <DropdownMenuContent className=" w-fit md:w-64 p-2 mt-3" align="end">
            <div className="flex justify-between items-center mb-2 px-2">
              <h2 className="font-semibold">Notifications</h2>
              {filteredNotifications.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => filteredNotifications.forEach((n) => markAsRead(n.id))}
                >
                  อ่านทั้งหมดแล้ว
                </Button>
              )}
            </div>
  
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.slice(0, 5).map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0  }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: 0.1 * i }}
                      className={`p-2 rounded hover:bg-muted cursor-pointer transition-colors ${
                        n.read ? "bg-muted/30" : "bg-muted/60 border-l-2 border-primary"
                      }`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          window.location.href = n.link;
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{n.title || "การแจ้งเตือน"}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {n.description || "ไม่มีคำอธิบาย"}
                          </p>
                          {n.createdAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(n.createdAt).toLocaleString("th-TH", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                        {!n.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    ไม่มีการแจ้งเตือน
                  </p>
                )}
              </AnimatePresence>
            </div>
  
            {filteredNotifications.length > 5 && (
              <DropdownMenuItem asChild className="mt-2">
                <Link
                  href={`/dashboard/${currentUser?.role}/notifications`}
                  className="w-full text-center text-sm text-primary font-medium"
                >
                  ดูการแจ้งเตือนทั้งหมด ({filteredNotifications.length})
                </Link>
              </DropdownMenuItem>
            )}
            {filteredNotifications.length <= 5 && filteredNotifications.length > 0 && (
              <DropdownMenuItem asChild className="mt-2">
                <Link
                  href={`/dashboard/${currentUser?.role}/notifications`}
                  className="w-full text-center text-sm text-primary font-medium"
                >
                  ดูการแจ้งเตือนทั้งหมด
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {/*UserBox */}
        <UserBox />
      </div>
    </header>
  );
}
