"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useNotificationStore, NotificationType } from "@/stores/notificationStore";
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useUserStore } from "@/stores/features/userStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Bell,
  BellOff,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

const PAGE_SIZE = 6;

interface TypeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getTypeConfig = (type: NotificationType): TypeConfig => {
  const configs: Record<NotificationType, TypeConfig> = {
    job_created: {
      label: "งานใหม่",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/10",
      textColor: "text-blue-400 dark:text-blue-400",
      icon: Briefcase,
    },
    job_updated: {
      label: "อัปเดตงาน",
      bgColor: "bg-indigo-500/10 dark:bg-indigo-500/10",
      textColor: "text-indigo-400 dark:text-indigo-400",
      icon: Briefcase,
    },
    job_completed: {
      label: "งานเสร็จสิ้น",
      bgColor: "bg-green-500/10 dark:bg-green-500/10",
      textColor: "text-green-400 dark:text-green-400",
      icon: CheckCircle2,
    },
    job_assigned: {
      label: "มอบหมายงาน",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/10",
      textColor: "text-purple-400 dark:text-purple-400",
      icon: Briefcase,
    },
    job_status_changed: {
      label: "เปลี่ยนสถานะงาน",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/10",
      textColor: "text-cyan-400 dark:text-cyan-400",
      icon: Briefcase,
    },
    report_submitted: {
      label: "รายงานใหม่",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/10",
      textColor: "text-amber-400 dark:text-amber-400",
      icon: AlertCircle,
    },
    report_assigned: {
      label: "มอบหมายรายงาน",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/10",
      textColor: "text-purple-400 dark:text-purple-400",
      icon: AlertCircle,
    },
    report_resolved: {
      label: "แก้ไขรายงาน",
      bgColor: "bg-green-500/10 dark:bg-green-500/10",
      textColor: "text-green-400 dark:text-green-400",
      icon: CheckCircle2,
    },
    user_created: {
      label: "ผู้ใช้ใหม่",
      bgColor: "bg-teal-500/10 dark:bg-teal-500/10",
      textColor: "text-teal-400 dark:text-teal-400",
      icon: Bell,
    },
    inventory_low: {
      label: "อุปกรณ์ใกล้หมด",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/10",
      textColor: "text-orange-400 dark:text-orange-400",
      icon: Package,
    },
    inventory_request_created: {
      label: "คำขอเบิกวัสดุ",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/10",
      textColor: "text-blue-400 dark:text-blue-400",
      icon: Package,
    },
    inventory_request_approved: {
      label: "อนุมัติเบิกวัสดุ",
      bgColor: "bg-green-500/10 dark:bg-green-500/10",
      textColor: "text-green-400 dark:text-green-400",
      icon: CheckCircle2,
    },
    inventory_request_rejected: {
      label: "ปฏิเสธเบิกวัสดุ",
      bgColor: "bg-red-500/10 dark:bg-red-500/10",
      textColor: "text-red-400 dark:text-red-400",
      icon: XCircle,
    },
    task_assigned: {
      label: "มอบหมายงาน",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/10",
      textColor: "text-purple-400 dark:text-purple-400",
      icon: Briefcase,
    },
    message: {
      label: "ข้อความ",
      bgColor: "bg-gray-500/10 dark:bg-gray-500/10",
      textColor: "text-gray-400 dark:text-gray-400",
      icon: Bell,
    },
    comment: {
      label: "ความคิดเห็น",
      bgColor: "bg-gray-500/10 dark:bg-gray-500/10",
      textColor: "text-gray-400 dark:text-gray-400",
      icon: Bell,
    },
    system: {
      label: "ระบบ",
      bgColor: "bg-gray-500/10 dark:bg-gray-500/10",
      textColor: "text-gray-400 dark:text-gray-400",
      icon: Bell,
    },
  };

  return configs[type] || configs.system;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    unreadCount 
  } = useNotificationStore();
  const { jobs, getJobById } = useJobStore();
  const { inventoryRequests } = useInventoryStore();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "job" | "inventory">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  // Filtered + sorted notifications - กรองเฉพาะที่เกี่ยวข้องกับงานที่ user ถูก assign
  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];

    let filtered = notifications;

    // กรอง notification ตาม role และการ assign
    filtered = filtered.filter((notification) => {
      // Admin เห็นทุก notification
      if (currentUser.role === "admin") {
        return true;
      }

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
            // ตรวจสอบว่า user ถูก assign งานหรือไม่
            const isAssigned = job.assignedEmployees?.some((emp) => emp.id === currentUser.id);
            
            // ถ้าไม่ได้ถูก assign ให้ไม่แสดง notification
            if (!isAssigned) {
              return false;
            }

            // สำหรับ inventory request ตรวจสอบเพิ่มเติมว่า user เป็นคนสร้าง request หรือเกี่ยวข้องกับ job
            if (notification.type.startsWith("inventory_request_")) {
              const request = inventoryRequests.find((req) => req.jobId === jobId);
              if (request) {
                // แสดงถ้า user ถูก assign งาน (ตรวจสอบแล้วด้านบน)
                return true;
              }
            }

            // สำหรับ job notification แสดงถ้า user ถูก assign
            return true;
          }
        }
      }

      // ถ้าไม่มี link หรือไม่พบ job ให้ไม่แสดง (ยกเว้น system notification)
      return false;
    });
    
    // Filter by read status
    if (filter === "read") filtered = filtered.filter((n) => n.read);
    if (filter === "unread") filtered = filtered.filter((n) => !n.read);

    // Filter by type (job or inventory)
    if (typeFilter === "job") {
      filtered = filtered.filter((n) => 
        n.type.startsWith("job_") || n.type === "task_assigned"
      );
    } else if (typeFilter === "inventory") {
      filtered = filtered.filter((n) => 
        n.type.startsWith("inventory_")
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [notifications, currentUser, jobs, getJobById, inventoryRequests, filter, typeFilter, sortOrder]);

  // คำนวณ unread count จาก filtered notifications
  const filteredUnreadCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.read).length;
  }, [filteredNotifications]);

  const totalPages = Math.ceil(filteredNotifications.length / PAGE_SIZE);
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleMarkAsRead = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      markAsRead(id);
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    handleMarkAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "dd MMM yyyy HH:mm", { locale: th });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">การแจ้งเตือน</h1>
          <p className="text-sm text-muted-foreground">
            {filteredUnreadCount > 0 ? `คุณมีการแจ้งเตือน ${filteredUnreadCount} รายการที่ยังไม่ได้อ่าน` : "ไม่มีการแจ้งเตือนใหม่"}
          </p>
        </div>
        {filteredUnreadCount > 0 && (
          <Button variant="outline" onClick={() => {
            filteredNotifications.forEach((n) => markAsRead(n.id));
          }}>
            <BellOff className="h-4 w-4 mr-2" />
            อ่านทั้งหมดแล้ว
          </Button>
        )}
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <Select
          value={filter}
          onValueChange={(val) => {
            setFilter(val as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="unread">ยังไม่ได้อ่าน</SelectItem>
            <SelectItem value="read">อ่านแล้ว</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(val) => {
            setTypeFilter(val as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="job">งาน</SelectItem>
            <SelectItem value="inventory">วัสดุการเบิก</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(val) => setSortOrder(val as any)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="เรียงตาม" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">ใหม่สุดก่อน</SelectItem>
            <SelectItem value="asc">เก่าที่สุดก่อน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification Cards */}
      {paginatedNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              ไม่พบการแจ้งเตือน
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {paginatedNotifications.map((n) => {
              const typeConfig = getTypeConfig(n.type);
              const Icon = typeConfig.icon;
              
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    className={`${
                      n.read ? "bg-muted/30" : "bg-muted/60 border-primary/20"
                    } hover:shadow-md transition-all cursor-pointer relative group`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                          <Icon className={`h-5 w-5 ${typeConfig.textColor}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${typeConfig.textColor} border-current/20`}
                          >
                            {typeConfig.label}
                          </Badge>
                          {!n.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base font-semibold mt-2">
                        {n.title || "การแจ้งเตือน"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {n.description}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(n.createdAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ก่อนหน้า
          </Button>
          <span className="text-sm">
            หน้า {page} จาก {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
